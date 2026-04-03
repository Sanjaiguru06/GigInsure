from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
import httpx
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from groq import Groq

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Groq client
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# JWT config
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

# App setup
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Password Hashing ───────────────────────────────────────────────
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# ─── JWT Token Management ───────────────────────────────────────────
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# ─── Auth Helper ────────────────────────────────────────────────────
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── Pydantic Models ────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    city: str = "Chennai"
    device_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class PricingRequest(BaseModel):
    city: str
    user_id: Optional[str] = None

class CreatePolicyRequest(BaseModel):
    city: str
    premium: float
    device_id: Optional[str] = None

class PaymentConfirmRequest(BaseModel):
    policy_id: str
    payment_method: str = "upi_simulation"

# ─── City Risk Data ─────────────────────────────────────────────────
CITY_RISK_MAP = {
    "chennai": {"risk": "high", "base_premium": 40},
    "mumbai": {"risk": "high", "base_premium": 40},
    "delhi": {"risk": "medium", "base_premium": 30},
    "bangalore": {"risk": "medium", "base_premium": 30},
    "kolkata": {"risk": "high", "base_premium": 40},
    "hyderabad": {"risk": "medium", "base_premium": 30},
    "pune": {"risk": "low", "base_premium": 20},
    "jaipur": {"risk": "low", "base_premium": 20},
    "ahmedabad": {"risk": "medium", "base_premium": 30},
    "lucknow": {"risk": "low", "base_premium": 20},
}

# ─── Weather Service ────────────────────────────────────────────────
async def get_weather_data(city: str) -> dict:
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(
                f"https://api.openweathermap.org/data/2.5/weather?q={city},IN&appid={api_key}&units=metric",
                timeout=10.0
            )
            if resp.status_code == 200:
                data = resp.json()
                rain_1h = data.get("rain", {}).get("1h", 0)
                wind_speed = data.get("wind", {}).get("speed", 0) * 3.6  # m/s to km/h
                temp = data.get("main", {}).get("temp", 30)
                humidity = data.get("main", {}).get("humidity", 50)
                weather_desc = data.get("weather", [{}])[0].get("description", "clear")
                return {
                    "rainfall_mm": rain_1h,
                    "wind_speed_kmh": round(wind_speed, 1),
                    "temperature": round(temp, 1),
                    "humidity": humidity,
                    "description": weather_desc,
                    "city": city,
                    "source": "openweathermap"
                }
    except Exception as e:
        logger.error(f"Weather API error: {e}")
    return {
        "rainfall_mm": 0, "wind_speed_kmh": 0, "temperature": 32,
        "humidity": 60, "description": "clear", "city": city, "source": "fallback"
    }

async def get_weather_forecast(city: str) -> dict:
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(
                f"https://api.openweathermap.org/data/2.5/forecast?q={city},IN&appid={api_key}&units=metric&cnt=40",
                timeout=10.0
            )
            if resp.status_code == 200:
                data = resp.json()
                forecasts = data.get("list", [])
                total_rain = sum(f.get("rain", {}).get("3h", 0) for f in forecasts)
                max_wind = max((f.get("wind", {}).get("speed", 0) * 3.6 for f in forecasts), default=0)
                avg_temp = sum(f.get("main", {}).get("temp", 30) for f in forecasts) / max(len(forecasts), 1)
                rain_days = sum(1 for f in forecasts if f.get("rain", {}).get("3h", 0) > 5)
                return {
                    "total_rain_mm": round(total_rain, 1),
                    "max_wind_kmh": round(max_wind, 1),
                    "avg_temp": round(avg_temp, 1),
                    "rain_periods": rain_days,
                    "forecast_count": len(forecasts)
                }
    except Exception as e:
        logger.error(f"Forecast API error: {e}")
    return {"total_rain_mm": 0, "max_wind_kmh": 10, "avg_temp": 32, "rain_periods": 0, "forecast_count": 0}

# ─── AI Premium Calculator ──────────────────────────────────────────
async def calculate_ai_multiplier(city: str, weather_forecast: dict, city_risk: dict) -> dict:
    try:
        prompt = f"""You are a risk assessment AI for a parametric insurance system for food delivery riders in India.

Given the following data, calculate a premium multiplier between 0.85 and 1.15:

City: {city}
City Risk Level: {city_risk.get('risk', 'medium')}
Weather Forecast (next 5 days):
- Total expected rainfall: {weather_forecast.get('total_rain_mm', 0)} mm
- Max wind speed: {weather_forecast.get('max_wind_kmh', 0)} km/h
- Average temperature: {weather_forecast.get('avg_temp', 30)}°C
- Rain periods (3-hour blocks with >5mm rain): {weather_forecast.get('rain_periods', 0)}

Rules:
- Higher rain/wind = higher multiplier (more risk)
- Extreme heat (>40°C) = slightly higher multiplier
- Calm weather = lower multiplier (reward safe conditions)
- Range MUST be between 0.85 and 1.15

Respond with ONLY a JSON object in this exact format:
{{"multiplier": <number>, "reasoning": "<brief explanation>"}}"""

        completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=200
        )
        response_text = completion.choices[0].message.content.strip()
        import json
        # Extract JSON from response
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start >= 0 and end > start:
            result = json.loads(response_text[start:end])
            multiplier = float(result.get("multiplier", 1.0))
            multiplier = max(0.85, min(1.15, multiplier))
            return {"multiplier": round(multiplier, 2), "reasoning": result.get("reasoning", "AI assessment"), "source": "groq_ai"}
    except Exception as e:
        logger.error(f"AI multiplier error: {e}")
    
    # Fallback rule-based calculation
    multiplier = 1.0
    rain = weather_forecast.get("total_rain_mm", 0)
    wind = weather_forecast.get("max_wind_kmh", 0)
    temp = weather_forecast.get("avg_temp", 30)
    if rain > 100:
        multiplier += 0.10
    elif rain > 50:
        multiplier += 0.05
    if wind > 40:
        multiplier += 0.05
    if temp > 40:
        multiplier += 0.03
    if rain < 10 and wind < 15:
        multiplier -= 0.10
    multiplier = max(0.85, min(1.15, multiplier))
    return {"multiplier": round(multiplier, 2), "reasoning": "Rule-based fallback calculation", "source": "rule_based"}

# ─── AUTH ROUTES ─────────────────────────────────────────────────────
@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    email = req.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": email,
        "password_hash": hash_password(req.password),
        "name": req.name,
        "city": req.city,
        "device_id": req.device_id or secrets.token_hex(8),
        "role": "rider",
        "reward_coins": 0,
        "redeemed_coins": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "id": user_id, "email": email, "name": req.name,
        "city": req.city, "role": "rider", "reward_coins": 0,
        "access_token": access_token
    }

@api_router.post("/auth/login")
async def login(req: LoginRequest, request: Request, response: Response):
    email = req.email.lower().strip()
    identifier = email  # Use email-only for brute force (IPs vary through load balancer)
    
    # Brute force check
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("lockout_until")
        if lockout_until:
            lockout_dt = datetime.fromisoformat(lockout_until) if isinstance(lockout_until, str) else lockout_until
            if datetime.now(timezone.utc) < lockout_dt:
                raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
            else:
                await db.login_attempts.delete_one({"identifier": identifier})
        else:
            raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        # Increment failed attempts; set lockout_until only once count reaches 5
        current = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
        new_count = (current.get("count", 0) if current else 0) + 1
        update_fields = {"count": new_count}
        if new_count >= 5:
            update_fields["lockout_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$set": update_fields},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "id": user_id, "email": email, "name": user.get("name", ""),
        "city": user.get("city", ""), "role": user.get("role", "rider"),
        "reward_coins": user.get("reward_coins", 0),
        "access_token": access_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        new_access = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=new_access, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed", "access_token": new_access}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ─── PRICING ROUTES ──────────────────────────────────────────────────
@api_router.post("/pricing")
async def calculate_pricing(req: PricingRequest):
    city = req.city.lower().strip()
    city_risk = CITY_RISK_MAP.get(city, {"risk": "medium", "base_premium": 30})
    base_premium = city_risk["base_premium"]
    
    weather_forecast = await get_weather_forecast(city)
    ai_result = await calculate_ai_multiplier(city, weather_forecast, city_risk)
    
    final_premium = round(base_premium * ai_result["multiplier"])
    final_premium = max(20, min(50, final_premium))
    
    return {
        "city": city,
        "risk_level": city_risk["risk"],
        "base_premium": base_premium,
        "multiplier": ai_result["multiplier"],
        "ai_reasoning": ai_result["reasoning"],
        "ai_source": ai_result["source"],
        "final_premium": final_premium,
        "weather_forecast": weather_forecast,
        "plan_type": "weekly",
        "coverage": {
            "major_disruption": "Heavy rain, cyclone — automatic payout",
            "minor_disruption": "Traffic, heat — coin rewards"
        }
    }

# ─── POLICY ROUTES ──────────────────────────────────────────────────
@api_router.post("/policies")
async def create_policy(req: CreatePolicyRequest, request: Request):
    user = await get_current_user(request)
    user_id = user["_id"]
    
    # Check for existing active policy
    active = await db.policies.find_one({
        "user_id": user_id,
        "status": "active",
        "end_date": {"$gt": datetime.now(timezone.utc).isoformat()}
    }, {"_id": 0})
    if active:
        raise HTTPException(status_code=400, detail="You already have an active policy")
    
    now = datetime.now(timezone.utc)
    policy_doc = {
        "policy_id": f"POL-{secrets.token_hex(4).upper()}",
        "user_id": user_id,
        "city": req.city,
        "premium": req.premium,
        "device_id": req.device_id or user.get("device_id", ""),
        "plan_type": "weekly",
        "start_date": now.isoformat(),
        "end_date": (now + timedelta(days=7)).isoformat(),
        "status": "pending_payment",
        "created_at": now.isoformat()
    }
    await db.policies.insert_one(policy_doc)
    policy_doc.pop("_id", None)
    return policy_doc

@api_router.get("/policies/active")
async def get_active_policy(request: Request):
    user = await get_current_user(request)
    policy = await db.policies.find_one(
        {"user_id": user["_id"], "status": "active", "end_date": {"$gt": datetime.now(timezone.utc).isoformat()}},
        {"_id": 0}
    )
    if not policy:
        return {"has_active_policy": False, "policy": None}
    return {"has_active_policy": True, "policy": policy}

@api_router.get("/policies/history")
async def get_policy_history(request: Request):
    user = await get_current_user(request)
    policies = await db.policies.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"policies": policies}

# ─── MOCK PAYMENT ────────────────────────────────────────────────────
@api_router.post("/payment/confirm")
async def confirm_payment(req: PaymentConfirmRequest, request: Request):
    user = await get_current_user(request)
    policy = await db.policies.find_one({"policy_id": req.policy_id, "user_id": user["_id"]}, {"_id": 0})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    if policy["status"] == "active":
        raise HTTPException(status_code=400, detail="Policy already active")
    
    await db.policies.update_one(
        {"policy_id": req.policy_id},
        {"$set": {"status": "active", "payment_method": req.payment_method, "paid_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Record payment
    payment_doc = {
        "payment_id": f"PAY-{secrets.token_hex(4).upper()}",
        "policy_id": req.policy_id,
        "user_id": user["_id"],
        "amount": policy["premium"],
        "method": req.payment_method,
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_doc)
    payment_doc.pop("_id", None)
    
    return {"message": "Payment successful", "policy_status": "active", "payment": payment_doc}

# ─── WEATHER ROUTE ───────────────────────────────────────────────────
@api_router.get("/weather/{city}")
async def get_weather(city: str):
    weather = await get_weather_data(city)
    forecast = await get_weather_forecast(city)
    return {"current": weather, "forecast": forecast}

# ─── SUPPORTED CITIES ────────────────────────────────────────────────
@api_router.get("/cities")
async def get_cities():
    return {"cities": [
        {"name": "Chennai", "risk": "high"},
        {"name": "Mumbai", "risk": "high"},
        {"name": "Delhi", "risk": "medium"},
        {"name": "Bangalore", "risk": "medium"},
        {"name": "Kolkata", "risk": "high"},
        {"name": "Hyderabad", "risk": "medium"},
        {"name": "Pune", "risk": "low"},
        {"name": "Jaipur", "risk": "low"},
        {"name": "Ahmedabad", "risk": "medium"},
        {"name": "Lucknow", "risk": "low"},
    ]}

# ─── USER PROFILE/WALLET ─────────────────────────────────────────────
@api_router.get("/wallet")
async def get_wallet(request: Request):
    user = await get_current_user(request)
    return {
        "total_coins": user.get("reward_coins", 0),
        "redeemed_coins": user.get("redeemed_coins", 0),
        "available_coins": user.get("reward_coins", 0) - user.get("redeemed_coins", 0),
        "cash_value": round((user.get("reward_coins", 0) - user.get("redeemed_coins", 0)) / 100, 2)
    }

# ─── STARTUP ─────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.policies.create_index("user_id")
    await db.policies.create_index("policy_id", unique=True)
    await db.login_attempts.create_index("identifier")
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@giginsure.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "city": "Chennai",
            "device_id": "ADMIN-001",
            "role": "admin",
            "reward_coins": 0,
            "redeemed_coins": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")
    
    # Seed test rider
    test_rider_email = "rider@test.com"
    test_rider_password = "rider123"
    existing_rider = await db.users.find_one({"email": test_rider_email})
    if not existing_rider:
        await db.users.insert_one({
            "email": test_rider_email,
            "password_hash": hash_password(test_rider_password),
            "name": "Test Rider",
            "city": "Chennai",
            "device_id": secrets.token_hex(8),
            "role": "rider",
            "reward_coins": 0,
            "redeemed_coins": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Test rider seeded: {test_rider_email}")
    
    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n")
        f.write(f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n")
        f.write(f"## Test Rider\n- Email: rider@test.com\n- Password: rider123\n- Role: rider\n\n")
        f.write(f"## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- GET /api/auth/me\n- POST /api/auth/logout\n- POST /api/auth/refresh\n")
    logger.info("GigInsure backend started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
