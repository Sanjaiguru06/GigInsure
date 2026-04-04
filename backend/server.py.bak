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
import json as json_module
import random
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

class TriggerEvaluateRequest(BaseModel):
    city: Optional[str] = None
    manual_weather: Optional[dict] = None  # For testing: {"rainfall_mm": 60, "wind_speed_kmh": 45, "temperature": 38}

class RedeemCoinsRequest(BaseModel):
    coins: int

class ChatRequest(BaseModel):
    message: str

class ActivitySimulateRequest(BaseModel):
    status: str = "active"  # active, idle, offline

# ─── Severity Factors ────────────────────────────────────────────────
SEVERITY_FACTORS = {
    "extreme": 0.9,
    "high": 0.7,
    "moderate": 0.5,
    "none": 0.0
}

# ─── Expected Earnings Estimator ─────────────────────────────────────
CITY_AVG_DAILY_EARNINGS = {
    "chennai": 350, "mumbai": 400, "delhi": 380, "bangalore": 370,
    "kolkata": 320, "hyderabad": 340, "pune": 310, "jaipur": 280,
    "ahmedabad": 300, "lucknow": 270
}

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

# ══════════════════════════════════════════════════════════════════════
# MODULE 3: RISK & SEVERITY ENGINE
# ══════════════════════════════════════════════════════════════════════

def classify_weather_severity(rainfall_mm: float, wind_speed_kmh: float, duration_min: float = 60) -> dict:
    """Parametric trigger classification for major disruptions."""
    if rainfall_mm >= 70 and wind_speed_kmh >= 40:
        return {"severity": "extreme", "trigger": "cyclone", "description": "Cyclone-level conditions: extreme rain + high winds"}
    if rainfall_mm >= 50 and duration_min >= 60:
        return {"severity": "high", "trigger": "heavy_rain", "description": "Heavy sustained rainfall disrupting operations"}
    if rainfall_mm >= 30 and duration_min >= 30:
        return {"severity": "moderate", "trigger": "moderate_rain", "description": "Moderate rainfall affecting delivery efficiency"}
    return {"severity": "none", "trigger": "clear", "description": "No significant weather disruption"}

def classify_minor_disruptions(temperature: float, traffic_delay_factor: float = 1.0) -> dict:
    """Classify minor disruptions for reward triggers."""
    triggers = []
    total_coins = 0
    
    # Traffic delay trigger
    if traffic_delay_factor >= 2.0:
        triggers.append({"type": "traffic_severe", "coins": 30, "detail": f"Severe traffic delay ({traffic_delay_factor}x normal)"})
        total_coins += 30
    elif traffic_delay_factor >= 1.5:
        triggers.append({"type": "traffic_moderate", "coins": 20, "detail": f"Moderate traffic delay ({traffic_delay_factor}x normal)"})
        total_coins += 20
    
    # Heat trigger
    if temperature >= 42:
        triggers.append({"type": "extreme_heat", "coins": 30, "detail": f"Extreme heat: {temperature}°C"})
        total_coins += 30
    elif temperature >= 40:
        triggers.append({"type": "high_heat", "coins": 20, "detail": f"High temperature: {temperature}°C"})
        total_coins += 20
    
    # Combo bonus
    if len(triggers) >= 2:
        triggers.append({"type": "combo_bonus", "coins": 20, "detail": "Bonus: Multiple disruptions at once"})
        total_coins += 20
    
    return {"triggers": triggers, "total_coins": total_coins, "eligible": total_coins > 0}

async def ai_severity_assessment(weather_data: dict, city: str) -> dict:
    """Use Groq AI for intelligent severity assessment."""
    try:
        prompt = f"""You are a risk assessment AI for parametric insurance for food delivery riders.

Analyze these conditions and provide severity assessment:
City: {city}
Current Weather:
- Rainfall: {weather_data.get('rainfall_mm', 0)} mm/hr
- Wind Speed: {weather_data.get('wind_speed_kmh', 0)} km/h
- Temperature: {weather_data.get('temperature', 30)}°C
- Humidity: {weather_data.get('humidity', 50)}%
- Description: {weather_data.get('description', 'clear')}

Parametric Thresholds:
- Extreme: Rain >= 70mm + Wind >= 40km/h (cyclone)
- High: Rain >= 50mm + Duration >= 60 min
- Moderate: Rain >= 30mm + Duration >= 30 min

Assess:
1. The likelihood the rider's income is disrupted
2. Estimated percentage of income loss (0-100%)
3. Risk score (0-100)
4. Whether this is a genuine disruption or normal conditions

Respond ONLY with JSON:
{{"risk_score": <0-100>, "income_loss_pct": <0-100>, "assessment": "<brief explanation>", "is_genuine_disruption": <true/false>, "recommended_action": "insurance_payout|reward_coins|no_action"}}"""

        completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=300
        )
        response_text = completion.choices[0].message.content.strip()
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start >= 0 and end > start:
            return json_module.loads(response_text[start:end])
    except Exception as e:
        logger.error(f"AI severity assessment error: {e}")
    
    # Fallback
    rain = weather_data.get("rainfall_mm", 0)
    score = min(100, int(rain * 1.2 + weather_data.get("wind_speed_kmh", 0) * 0.5))
    return {"risk_score": score, "income_loss_pct": min(80, score), "assessment": "Rule-based fallback", "is_genuine_disruption": rain > 20, "recommended_action": "insurance_payout" if rain >= 50 else ("reward_coins" if weather_data.get("temperature", 30) >= 40 else "no_action")}

async def estimate_expected_earnings(city: str, user_id: str = None) -> dict:
    """Estimate expected daily earnings for a rider."""
    city_lower = city.lower()
    base = CITY_AVG_DAILY_EARNINGS.get(city_lower, 300)
    # Add slight variance to simulate real prediction
    hour = datetime.now(timezone.utc).hour
    time_factor = 1.1 if 11 <= hour <= 14 or 18 <= hour <= 22 else 0.9
    expected = round(base * time_factor)
    return {"expected_daily": expected, "city": city, "base_avg": base, "time_factor": round(time_factor, 2)}

# ─── TRIGGER EVALUATION (Main Entry Point) ───────────────────────────
@api_router.post("/triggers/evaluate")
async def evaluate_triggers(req: TriggerEvaluateRequest, request: Request):
    """Main trigger evaluation — evaluates weather, traffic & heat triggers."""
    user = await get_current_user(request)
    city = (req.city or user.get("city", "Chennai")).lower()
    
    # Check active policy
    active_policy = await db.policies.find_one(
        {"user_id": user["_id"], "status": "active", "end_date": {"$gt": datetime.now(timezone.utc).isoformat()}},
        {"_id": 0}
    )
    if not active_policy:
        raise HTTPException(status_code=400, detail="No active policy. Subscribe first.")
    
    # Get weather data (real or manual override for testing)
    if req.manual_weather:
        weather = req.manual_weather
        weather["city"] = city
        weather["source"] = "manual_input"
    else:
        weather = await get_weather_data(city)
    
    # Simulate traffic delay factor based on conditions
    traffic_delay = 1.0
    if weather.get("rainfall_mm", 0) > 20:
        traffic_delay = 1.5 + (weather.get("rainfall_mm", 0) - 20) * 0.02
    elif weather.get("temperature", 30) > 38:
        traffic_delay = 1.2 + (weather.get("temperature", 30) - 38) * 0.1
    traffic_delay = round(min(3.0, traffic_delay), 2)
    
    # MODULE 3: Classify severity
    weather_severity = classify_weather_severity(
        weather.get("rainfall_mm", 0),
        weather.get("wind_speed_kmh", 0)
    )
    
    # MODULE 3: Classify minor disruptions
    minor_disruptions = classify_minor_disruptions(
        weather.get("temperature", 30),
        traffic_delay
    )
    
    # MODULE 3: AI assessment
    ai_assessment = await ai_severity_assessment(weather, city)
    
    # MODULE 3: Decision routing
    decision = "no_action"
    if weather_severity["severity"] in ["high", "extreme"]:
        decision = "insurance_payout"
    elif weather_severity["severity"] == "moderate":
        decision = "partial_insurance"
    elif minor_disruptions["eligible"]:
        decision = "reward_coins"
    
    # Expected earnings
    earnings_est = await estimate_expected_earnings(city, user["_id"])
    
    # Store trigger event
    trigger_event = {
        "trigger_id": f"TRG-{secrets.token_hex(4).upper()}",
        "user_id": user["_id"],
        "policy_id": active_policy["policy_id"],
        "city": city,
        "weather_data": weather,
        "traffic_delay_factor": traffic_delay,
        "weather_severity": weather_severity,
        "minor_disruptions": minor_disruptions,
        "ai_assessment": ai_assessment,
        "decision": decision,
        "expected_earnings": earnings_est,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.trigger_events.insert_one(trigger_event)
    trigger_event.pop("_id", None)
    
    # AUTO-PROCESS: If payout or reward, auto-trigger
    result = {**trigger_event}
    
    if decision in ["insurance_payout", "partial_insurance"]:
        # Auto-process claim (zero-touch)
        claim_result = await _process_claim(user, active_policy, weather_severity, ai_assessment, earnings_est, trigger_event["trigger_id"])
        result["claim"] = claim_result
    
    if minor_disruptions["eligible"]:
        # Auto-award coins
        reward_result = await _process_rewards(user, minor_disruptions, trigger_event["trigger_id"])
        result["reward"] = reward_result
    
    return result

# ─── SEVERITY ENDPOINT ───────────────────────────────────────────────
@api_router.post("/severity")
async def get_severity(request: Request):
    """Get current severity for user's city."""
    user = await get_current_user(request)
    city = user.get("city", "Chennai")
    weather = await get_weather_data(city)
    severity = classify_weather_severity(weather.get("rainfall_mm", 0), weather.get("wind_speed_kmh", 0))
    ai = await ai_severity_assessment(weather, city)
    return {"weather": weather, "severity": severity, "ai_assessment": ai}

# ─── RISK SCORE ENDPOINT ─────────────────────────────────────────────
@api_router.post("/risk-score")
async def get_risk_score(request: Request):
    """Calculate risk score for user."""
    user = await get_current_user(request)
    city = user.get("city", "Chennai")
    weather = await get_weather_data(city)
    ai = await ai_severity_assessment(weather, city)
    return {"risk_score": ai.get("risk_score", 0), "risk_level": "high" if ai.get("risk_score", 0) > 60 else ("medium" if ai.get("risk_score", 0) > 30 else "low"), "ai_assessment": ai}

# ══════════════════════════════════════════════════════════════════════
# MODULE 4: FINANCIAL ENGINE
# ══════════════════════════════════════════════════════════════════════

async def _fraud_check(user: dict, policy: dict, weather_severity: dict) -> dict:
    """Multi-layer fraud validation."""
    flags = []
    is_fraud = False
    
    # Device ID validation
    if not user.get("device_id"):
        flags.append("missing_device_id")
    
    # Check for duplicate claims within 24 hours
    recent_claim = await db.claims.find_one({
        "user_id": user["_id"],
        "timestamp": {"$gt": (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()}
    }, {"_id": 0})
    if recent_claim:
        flags.append("duplicate_claim_24h")
        is_fraud = True
    
    # Check if severity matches conditions (basic behavioral check)
    if weather_severity["severity"] == "extreme":
        # If claiming extreme but weather is actually mild
        pass  # In real system: check GPS speed vs claimed conditions
    
    # Zone validation: check if other riders in same city also affected
    city_policies = await db.policies.count_documents({"city": policy.get("city", ""), "status": "active"})
    if city_policies <= 0:
        flags.append("no_zone_validation")
    
    return {
        "passed": not is_fraud,
        "flags": flags,
        "check_count": 4,
        "checks": ["device_validation", "duplicate_check", "behavioral_check", "zone_validation"]
    }

async def _process_claim(user: dict, policy: dict, severity: dict, ai_assessment: dict, earnings: dict, trigger_id: str) -> dict:
    """Zero-touch claim processing."""
    # Step 1: Fraud check
    fraud_result = await _fraud_check(user, policy, severity)
    
    if not fraud_result["passed"]:
        claim_doc = {
            "claim_id": f"CLM-{secrets.token_hex(4).upper()}",
            "user_id": user["_id"],
            "policy_id": policy["policy_id"],
            "trigger_id": trigger_id,
            "status": "rejected",
            "reason": f"Fraud check failed: {', '.join(fraud_result['flags'])}",
            "fraud_check": fraud_result,
            "payout": 0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.claims.insert_one(claim_doc)
        claim_doc.pop("_id", None)
        return claim_doc
    
    # Step 2: Calculate payout
    severity_factor = SEVERITY_FACTORS.get(severity["severity"], 0)
    expected = earnings.get("expected_daily", 300)
    # Simulate actual earnings (reduced due to disruption)
    income_loss_pct = min(90, ai_assessment.get("income_loss_pct", 50))
    actual = round(expected * (1 - income_loss_pct / 100))
    loss = expected - actual
    payout = round(loss * severity_factor)
    
    # Step 3: Create claim
    claim_doc = {
        "claim_id": f"CLM-{secrets.token_hex(4).upper()}",
        "user_id": user["_id"],
        "policy_id": policy["policy_id"],
        "trigger_id": trigger_id,
        "status": "approved",
        "severity": severity["severity"],
        "severity_factor": severity_factor,
        "expected_earnings": expected,
        "actual_earnings": actual,
        "income_loss": loss,
        "payout": payout,
        "fraud_check": fraud_result,
        "ai_assessment": {
            "risk_score": ai_assessment.get("risk_score", 0),
            "assessment": ai_assessment.get("assessment", ""),
        },
        "processing_steps": [
            {"step": "Data Collection", "status": "complete"},
            {"step": "Severity Assessment", "status": "complete", "result": severity["severity"]},
            {"step": "Fraud Detection", "status": "complete", "result": "passed"},
            {"step": "Payout Calculation", "status": "complete", "result": f"₹{payout}"},
            {"step": "Credit to Wallet", "status": "complete"},
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.claims.insert_one(claim_doc)
    claim_doc.pop("_id", None)
    
    # Credit payout to user's wallet balance (simulated)
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$inc": {"wallet_balance": payout}, "$set": {"last_payout": datetime.now(timezone.utc).isoformat()}}
    )
    
    return claim_doc

async def _process_rewards(user: dict, minor_disruptions: dict, trigger_id: str) -> dict:
    """Process coin rewards for minor disruptions."""
    total_coins = minor_disruptions["total_coins"]
    
    reward_doc = {
        "reward_id": f"RWD-{secrets.token_hex(4).upper()}",
        "user_id": user["_id"],
        "trigger_id": trigger_id,
        "triggers": minor_disruptions["triggers"],
        "total_coins": total_coins,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.rewards.insert_one(reward_doc)
    reward_doc.pop("_id", None)
    
    # Update user's reward coins
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$inc": {"reward_coins": total_coins}}
    )
    
    return reward_doc

# ─── CLAIMS ENDPOINTS ────────────────────────────────────────────────
@api_router.get("/claims/history")
async def get_claims_history(request: Request):
    user = await get_current_user(request)
    claims = await db.claims.find({"user_id": user["_id"]}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    total_payout = sum(c.get("payout", 0) for c in claims)
    approved = sum(1 for c in claims if c.get("status") == "approved")
    rejected = sum(1 for c in claims if c.get("status") == "rejected")
    return {"claims": claims, "total_payout": total_payout, "approved_count": approved, "rejected_count": rejected, "total_count": len(claims)}

@api_router.get("/claims/{claim_id}")
async def get_claim_detail(claim_id: str, request: Request):
    user = await get_current_user(request)
    claim = await db.claims.find_one({"claim_id": claim_id, "user_id": user["_id"]}, {"_id": 0})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim

# ─── REWARDS ENDPOINTS ───────────────────────────────────────────────
@api_router.get("/rewards/history")
async def get_rewards_history(request: Request):
    user = await get_current_user(request)
    rewards = await db.rewards.find({"user_id": user["_id"]}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    total_earned = sum(r.get("total_coins", 0) for r in rewards)
    return {"rewards": rewards, "total_earned": total_earned, "count": len(rewards)}

@api_router.post("/wallet/redeem")
async def redeem_coins(req: RedeemCoinsRequest, request: Request):
    user = await get_current_user(request)
    available = user.get("reward_coins", 0) - user.get("redeemed_coins", 0)
    if req.coins > available:
        raise HTTPException(status_code=400, detail=f"Insufficient coins. Available: {available}")
    if req.coins < 100:
        raise HTTPException(status_code=400, detail="Minimum redemption is 100 coins")
    
    cash_value = round(req.coins / 100, 2)
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$inc": {"redeemed_coins": req.coins, "wallet_balance": cash_value}}
    )
    
    redemption_doc = {
        "redemption_id": f"RED-{secrets.token_hex(4).upper()}",
        "user_id": user["_id"],
        "coins_redeemed": req.coins,
        "cash_value": cash_value,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.redemptions.insert_one(redemption_doc)
    redemption_doc.pop("_id", None)
    return {"message": "Coins redeemed successfully", "redemption": redemption_doc}

# ─── TRIGGER HISTORY ─────────────────────────────────────────────────
@api_router.get("/triggers/history")
async def get_trigger_history(request: Request):
    user = await get_current_user(request)
    triggers = await db.trigger_events.find({"user_id": user["_id"]}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    return {"triggers": triggers, "count": len(triggers)}

# ─── DASHBOARD SUMMARY ───────────────────────────────────────────────
@api_router.get("/dashboard/summary")
async def get_dashboard_summary(request: Request):
    user = await get_current_user(request)
    uid = user["_id"]
    
    # Get active policy
    policy = await db.policies.find_one(
        {"user_id": uid, "status": "active", "end_date": {"$gt": datetime.now(timezone.utc).isoformat()}},
        {"_id": 0}
    )
    
    # Claims stats
    claims = await db.claims.find({"user_id": uid}, {"_id": 0}).to_list(100)
    total_payout = sum(c.get("payout", 0) for c in claims)
    
    # Rewards stats
    rewards = await db.rewards.find({"user_id": uid}, {"_id": 0}).to_list(100)
    total_coins_earned = sum(r.get("total_coins", 0) for r in rewards)
    
    # Latest trigger
    latest_trigger = await db.trigger_events.find_one({"user_id": uid}, {"_id": 0}, sort=[("timestamp", -1)])
    
    # Wallet
    wallet_balance = user.get("wallet_balance", 0)
    available_coins = user.get("reward_coins", 0) - user.get("redeemed_coins", 0)
    
    return {
        "has_active_policy": policy is not None,
        "policy": policy,
        "total_payout": total_payout,
        "total_claims": len(claims),
        "approved_claims": sum(1 for c in claims if c.get("status") == "approved"),
        "total_coins_earned": total_coins_earned,
        "available_coins": available_coins,
        "wallet_balance": wallet_balance,
        "cash_value": round(available_coins / 100, 2),
        "latest_trigger": latest_trigger,
        "recent_claims": claims[:3],
        "recent_rewards": rewards[:3]
    }

# ══════════════════════════════════════════════════════════════════════
# AI RISK ADVISOR CHATBOT
# ══════════════════════════════════════════════════════════════════════

@api_router.post("/chat")
async def ai_chat(req: ChatRequest, request: Request):
    user = await get_current_user(request)
    city = user.get("city", "Chennai")
    weather = await get_weather_data(city)
    severity = classify_weather_severity(weather.get("rainfall_mm", 0), weather.get("wind_speed_kmh", 0))
    earnings = await estimate_expected_earnings(city, user["_id"])
    policy = await db.policies.find_one({"user_id": user["_id"], "status": "active"}, {"_id": 0})

    system_prompt = f"""You are GigInsure AI Risk Advisor for food delivery riders in India. Be concise, friendly, use simple language.

Current data for {city}:
- Weather: {weather.get('description','clear')}, Rain: {weather.get('rainfall_mm',0)}mm, Wind: {weather.get('wind_speed_kmh',0)}km/h, Temp: {weather.get('temperature',30)}°C
- Severity: {severity.get('severity','none')} ({severity.get('description','')})
- Expected earnings today: Rs{earnings.get('expected_daily',300)}
- Policy: {'Active' if policy else 'No active policy'}
- Rider: {user.get('name','Rider')}, Coins: {user.get('reward_coins',0)}

Help the rider with questions about: weather risk, whether to go out, earnings prediction, insurance coverage, rewards.
Keep answers under 100 words. Use Rs for currency."""

    try:
        completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=200
        )
        reply = completion.choices[0].message.content.strip()
        return {"reply": reply, "weather": weather, "severity": severity["severity"]}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {"reply": f"Current conditions in {city}: {weather.get('description','clear')}, {weather.get('temperature',30)}°C. Severity: {severity['severity']}. Stay safe!", "weather": weather, "severity": severity["severity"]}

# ══════════════════════════════════════════════════════════════════════
# RISK HEATMAP — All Cities Weather
# ══════════════════════════════════════════════════════════════════════

@api_router.get("/heatmap")
async def get_heatmap():
    cities_list = ["Chennai", "Mumbai", "Delhi", "Bangalore", "Kolkata", "Hyderabad", "Pune", "Jaipur", "Ahmedabad", "Lucknow"]
    city_coords = {
        "Chennai": [13.08, 80.27], "Mumbai": [19.08, 72.88], "Delhi": [28.61, 77.21],
        "Bangalore": [12.97, 77.59], "Kolkata": [22.57, 88.36], "Hyderabad": [17.39, 78.49],
        "Pune": [18.52, 73.86], "Jaipur": [26.91, 75.79], "Ahmedabad": [23.02, 72.57], "Lucknow": [26.85, 80.95]
    }
    results = []
    for city in cities_list:
        weather = await get_weather_data(city)
        sev = classify_weather_severity(weather.get("rainfall_mm", 0), weather.get("wind_speed_kmh", 0))
        risk_info = CITY_RISK_MAP.get(city.lower(), {"risk": "medium", "base_premium": 30})
        results.append({
            "city": city, "coords": city_coords.get(city, [20, 78]),
            "weather": weather, "severity": sev["severity"], "trigger": sev["trigger"],
            "risk_level": risk_info["risk"], "base_premium": risk_info["base_premium"],
            "description": sev["description"]
        })
    return {"cities": results}

# ══════════════════════════════════════════════════════════════════════
# ADMIN DASHBOARD
# ══════════════════════════════════════════════════════════════════════

@api_router.get("/admin/stats")
async def admin_stats(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_riders = await db.users.count_documents({"role": "rider"})
    active_policies = await db.policies.count_documents({"status": "active"})
    total_claims = await db.claims.count_documents({})
    approved_claims = await db.claims.count_documents({"status": "approved"})
    rejected_claims = await db.claims.count_documents({"status": "rejected"})
    
    all_claims = await db.claims.find({}, {"_id": 0, "payout": 1}).to_list(1000)
    total_payouts = sum(c.get("payout", 0) for c in all_claims)
    
    all_policies = await db.policies.find({}, {"_id": 0, "premium": 1}).to_list(1000)
    total_premiums = sum(p.get("premium", 0) for p in all_policies)
    
    total_rewards = await db.rewards.count_documents({})
    total_triggers = await db.trigger_events.count_documents({})
    
    # City breakdown
    city_stats = []
    for city_name in ["Chennai", "Mumbai", "Delhi", "Bangalore", "Kolkata", "Hyderabad", "Pune", "Jaipur", "Ahmedabad", "Lucknow"]:
        city_lower = city_name.lower()
        city_policies = await db.policies.count_documents({"city": city_lower})
        city_stats.append({"city": city_name, "policies": city_policies, "risk": CITY_RISK_MAP.get(city_lower, {}).get("risk", "medium")})
    
    return {
        "total_riders": total_riders, "active_policies": active_policies,
        "total_claims": total_claims, "approved_claims": approved_claims,
        "rejected_claims": rejected_claims, "total_payouts": total_payouts,
        "total_premiums": total_premiums, "total_rewards": total_rewards,
        "total_triggers": total_triggers, "city_stats": city_stats,
        "fraud_rate": round(rejected_claims / max(total_claims, 1) * 100, 1)
    }

@api_router.get("/admin/riders")
async def admin_riders(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    riders = await db.users.find({"role": "rider"}, {"_id": 0, "password_hash": 0}).to_list(100)
    return {"riders": riders}

@api_router.get("/admin/recent-activity")
async def admin_recent_activity(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    claims = await db.claims.find({}, {"_id": 0}).sort("timestamp", -1).to_list(10)
    triggers = await db.trigger_events.find({}, {"_id": 0}).sort("timestamp", -1).to_list(10)
    return {"recent_claims": claims, "recent_triggers": triggers}

# ══════════════════════════════════════════════════════════════════════
# ACTIVITY TRACKING (Module 2)
# ══════════════════════════════════════════════════════════════════════

@api_router.post("/activity/simulate")
async def simulate_activity(req: ActivitySimulateRequest, request: Request):
    user = await get_current_user(request)
    activity_doc = {
        "user_id": user["_id"],
        "status": req.status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "device_id": user.get("device_id", ""),
        "city": user.get("city", "Chennai"),
        "session_duration": round(random.uniform(0.5, 8.0), 1),
        "speed": round(random.uniform(0, 40), 1) if req.status == "active" else 0,
        "movement": "moving" if req.status == "active" else ("stationary" if req.status == "idle" else "none")
    }
    await db.activity_logs.insert_one(activity_doc)
    activity_doc.pop("_id", None)
    
    # Update user activity status
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"activity_status": req.status, "last_active": datetime.now(timezone.utc).isoformat()}}
    )
    return activity_doc

@api_router.get("/activity/status")
async def get_activity_status(request: Request):
    user = await get_current_user(request)
    # Get recent activity
    recent = await db.activity_logs.find(
        {"user_id": user["_id"]}, {"_id": 0}
    ).sort("timestamp", -1).to_list(10)
    
    # Intent check: was rider active in last 48 hours?
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
    recent_active = await db.activity_logs.count_documents({
        "user_id": user["_id"], "status": "active", "timestamp": {"$gt": cutoff}
    })
    intent_status = "active" if recent_active > 0 else "inactive"
    
    return {
        "current_status": user.get("activity_status", "offline"),
        "intent_status": intent_status,
        "recent_active_sessions": recent_active,
        "last_active": user.get("last_active"),
        "recent_logs": recent[:5]
    }

# ══════════════════════════════════════════════════════════════════════
# POLICY RENEWAL
# ══════════════════════════════════════════════════════════════════════

@api_router.post("/policies/renew")
async def renew_policy(request: Request):
    user = await get_current_user(request)
    # Find expired or about-to-expire policy
    current = await db.policies.find_one(
        {"user_id": user["_id"]}, {"_id": 0}, sort=[("created_at", -1)]
    )
    if not current:
        raise HTTPException(status_code=400, detail="No previous policy to renew")
    
    # Check no active policy
    active = await db.policies.find_one(
        {"user_id": user["_id"], "status": "active", "end_date": {"$gt": datetime.now(timezone.utc).isoformat()}},
        {"_id": 0}
    )
    if active:
        raise HTTPException(status_code=400, detail="You already have an active policy")
    
    now = datetime.now(timezone.utc)
    new_policy = {
        "policy_id": f"POL-{secrets.token_hex(4).upper()}",
        "user_id": user["_id"],
        "city": current["city"],
        "premium": current["premium"],
        "device_id": current.get("device_id", ""),
        "plan_type": "weekly",
        "start_date": now.isoformat(),
        "end_date": (now + timedelta(days=7)).isoformat(),
        "status": "active",
        "renewed_from": current["policy_id"],
        "created_at": now.isoformat(),
        "paid_at": now.isoformat(),
        "payment_method": "auto_renewal"
    }
    await db.policies.insert_one(new_policy)
    new_policy.pop("_id", None)
    
    payment_doc = {
        "payment_id": f"PAY-{secrets.token_hex(4).upper()}",
        "policy_id": new_policy["policy_id"],
        "user_id": user["_id"],
        "amount": new_policy["premium"],
        "method": "auto_renewal",
        "status": "success",
        "timestamp": now.isoformat()
    }
    await db.payments.insert_one(payment_doc)
    
    return {"message": "Policy renewed successfully", "policy": new_policy}

# ══════════════════════════════════════════════════════════════════════
# PAYMENT HISTORY
# ══════════════════════════════════════════════════════════════════════

@api_router.get("/payments/history")
async def get_payment_history(request: Request):
    user = await get_current_user(request)
    payments = await db.payments.find({"user_id": user["_id"]}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    total_paid = sum(p.get("amount", 0) for p in payments)
    return {"payments": payments, "total_paid": total_paid, "count": len(payments)}

# ══════════════════════════════════════════════════════════════════════
# EARNINGS ANALYTICS
# ══════════════════════════════════════════════════════════════════════

@api_router.get("/analytics/earnings")
async def get_earnings_analytics(request: Request):
    user = await get_current_user(request)
    uid = user["_id"]
    city = user.get("city", "Chennai").lower()
    base_earnings = CITY_AVG_DAILY_EARNINGS.get(city, 300)
    
    # Build 7-day earnings data from triggers/claims
    data_points = []
    claims = await db.claims.find({"user_id": uid}, {"_id": 0}).sort("timestamp", 1).to_list(100)
    rewards_list = await db.rewards.find({"user_id": uid}, {"_id": 0}).sort("timestamp", 1).to_list(100)
    
    for i in range(7):
        day = datetime.now(timezone.utc) - timedelta(days=6 - i)
        day_str = day.strftime("%a")
        expected = base_earnings + random.randint(-30, 30)
        day_claims = [c for c in claims if c.get("timestamp", "")[:10] == day.strftime("%Y-%m-%d")]
        day_rewards = [r for r in rewards_list if r.get("timestamp", "")[:10] == day.strftime("%Y-%m-%d")]
        payout = sum(c.get("payout", 0) for c in day_claims)
        coins = sum(r.get("total_coins", 0) for r in day_rewards)
        actual = expected - random.randint(0, 80) if day_claims else expected - random.randint(0, 20)
        
        data_points.append({
            "day": day_str, "date": day.strftime("%Y-%m-%d"),
            "expected": expected, "actual": max(0, actual),
            "payout": payout, "coins": coins
        })
    
    # Claim distribution
    total_claims = await db.claims.count_documents({"user_id": uid})
    approved = await db.claims.count_documents({"user_id": uid, "status": "approved"})
    rejected = total_claims - approved
    
    total_payout = sum(c.get("payout", 0) for c in claims)
    total_premium = sum(p.get("premium", 0) for p in await db.policies.find({"user_id": uid}, {"_id": 0}).to_list(50))
    
    return {
        "daily_earnings": data_points,
        "claim_distribution": {"approved": approved, "rejected": rejected},
        "total_payout": total_payout,
        "total_premium": total_premium,
        "roi": round((total_payout / max(total_premium, 1)) * 100, 1)
    }

# ─── STARTUP ─────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.policies.create_index("user_id")
    await db.policies.create_index("policy_id", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.claims.create_index("user_id")
    await db.claims.create_index("claim_id", unique=True)
    await db.rewards.create_index("user_id")
    await db.trigger_events.create_index("user_id")
    
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
        f.write("# Test Credentials\n\n")
        f.write(f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n")
        f.write("## Test Rider\n- Email: rider@test.com\n- Password: rider123\n- Role: rider\n\n")
        f.write("## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- GET /api/auth/me\n- POST /api/auth/logout\n- POST /api/auth/refresh\n")
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
