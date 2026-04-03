#!/usr/bin/env python3
"""
GigInsure Backend API Testing Suite
Tests all backend endpoints for the AI-powered parametric insurance platform
"""

import requests
import sys
import json
from datetime import datetime
import time

class GigInsureAPITester:
    def __init__(self, base_url="https://rider-cover.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test credentials from /app/memory/test_credentials.md
        self.admin_email = "admin@giginsure.com"
        self.admin_password = "admin123"
        self.test_rider_email = "rider@test.com"
        self.test_rider_password = "rider123"
        
        print(f"🚀 Starting GigInsure API Tests")
        print(f"📍 Backend URL: {self.base_url}")
        print(f"🔗 API Base: {self.api_url}")
        print("=" * 60)

    def log_test(self, name, method, endpoint, expected_status, actual_status, success, response_data=None, error=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test_name": name,
            "method": method,
            "endpoint": endpoint,
            "expected_status": expected_status,
            "actual_status": actual_status,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data,
            "error": error
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {name} - {method} {endpoint}")
        if not success:
            print(f"   Expected: {expected_status}, Got: {actual_status}")
            if error:
                print(f"   Error: {error}")
        print()

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
            except:
                response_data = response.text[:200] if response.text else None
                
            self.log_test(name, method, endpoint, expected_status, response.status_code, success, response_data)
            
            return success, response_data, response

        except Exception as e:
            self.log_test(name, method, endpoint, expected_status, 0, False, error=str(e))
            return False, {}, None

    def test_auth_register(self):
        """Test user registration"""
        # Test with new user (timestamp to avoid conflicts)
        timestamp = int(time.time())
        test_email = f"test_rider_{timestamp}@test.com"
        
        success, data, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            {
                "email": test_email,
                "password": "testpass123",
                "name": "Test Rider",
                "city": "Chennai"
            }
        )
        
        if success and data:
            print(f"   ✓ User registered with ID: {data.get('id', 'N/A')}")
            print(f"   ✓ Access token received: {'Yes' if data.get('access_token') else 'No'}")
            return data.get('access_token')
        return None

    def test_auth_login_admin(self):
        """Test admin login"""
        success, data, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            {
                "email": self.admin_email,
                "password": self.admin_password
            }
        )
        
        if success and data:
            print(f"   ✓ Admin logged in: {data.get('name', 'N/A')}")
            print(f"   ✓ Role: {data.get('role', 'N/A')}")
            return data.get('access_token')
        return None

    def test_auth_login_rider(self):
        """Test rider login (register first if needed)"""
        # Try to login first
        success, data, response = self.run_test(
            "Rider Login",
            "POST",
            "auth/login",
            200,
            {
                "email": self.test_rider_email,
                "password": self.test_rider_password
            }
        )
        
        if not success:
            # Register the rider first
            print("   📝 Rider not found, registering...")
            reg_success, reg_data, reg_response = self.run_test(
                "Rider Registration",
                "POST",
                "auth/register",
                200,
                {
                    "email": self.test_rider_email,
                    "password": self.test_rider_password,
                    "name": "Test Rider",
                    "city": "Chennai"
                }
            )
            if reg_success:
                return reg_data.get('access_token')
        else:
            print(f"   ✓ Rider logged in: {data.get('name', 'N/A')}")
            return data.get('access_token')
        
        return None

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        success, data, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success and data:
            print(f"   ✓ User: {data.get('name', 'N/A')} ({data.get('email', 'N/A')})")
            print(f"   ✓ City: {data.get('city', 'N/A')}")
            print(f"   ✓ Role: {data.get('role', 'N/A')}")
        
        return success

    def test_auth_logout(self):
        """Test logout"""
        success, data, response = self.run_test(
            "User Logout",
            "POST",
            "auth/logout",
            200
        )
        
        if success:
            print("   ✓ Logout successful")
        
        return success

    def test_pricing_api(self):
        """Test dynamic pricing API"""
        cities_to_test = ["Chennai", "Mumbai", "Delhi", "Bangalore"]
        
        for city in cities_to_test:
            success, data, response = self.run_test(
                f"Pricing for {city}",
                "POST",
                "pricing",
                200,
                {"city": city}
            )
            
            if success and data:
                print(f"   ✓ City: {city}")
                print(f"   ✓ Risk Level: {data.get('risk_level', 'N/A')}")
                print(f"   ✓ Base Premium: ₹{data.get('base_premium', 'N/A')}")
                print(f"   ✓ AI Multiplier: {data.get('multiplier', 'N/A')}")
                print(f"   ✓ Final Premium: ₹{data.get('final_premium', 'N/A')}")
                print(f"   ✓ AI Source: {data.get('ai_source', 'N/A')}")
                print(f"   ✓ AI Reasoning: {data.get('ai_reasoning', 'N/A')[:50]}...")
                
                # Validate pricing structure
                required_fields = ['city', 'risk_level', 'base_premium', 'multiplier', 'final_premium', 'weather_forecast']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    print(f"   ⚠️  Missing fields: {missing_fields}")
            print()

    def test_policy_creation(self):
        """Test policy creation"""
        success, data, response = self.run_test(
            "Create Policy",
            "POST",
            "policies",
            200,
            {
                "city": "Chennai",
                "premium": 35.0
            }
        )
        
        if success and data:
            policy_id = data.get('policy_id')
            print(f"   ✓ Policy created: {policy_id}")
            print(f"   ✓ Status: {data.get('status', 'N/A')}")
            print(f"   ✓ Premium: ₹{data.get('premium', 'N/A')}")
            print(f"   ✓ Plan Type: {data.get('plan_type', 'N/A')}")
            return policy_id
        
        return None

    def test_active_policy(self):
        """Test get active policy"""
        success, data, response = self.run_test(
            "Get Active Policy",
            "GET",
            "policies/active",
            200
        )
        
        if success and data:
            has_active = data.get('has_active_policy', False)
            print(f"   ✓ Has Active Policy: {has_active}")
            if has_active:
                policy = data.get('policy', {})
                print(f"   ✓ Policy ID: {policy.get('policy_id', 'N/A')}")
                print(f"   ✓ Status: {policy.get('status', 'N/A')}")
        
        return success

    def test_payment_confirm(self, policy_id):
        """Test mock payment confirmation"""
        if not policy_id:
            print("❌ No policy ID provided for payment test")
            return False
            
        success, data, response = self.run_test(
            "Confirm Payment",
            "POST",
            "payment/confirm",
            200,
            {
                "policy_id": policy_id,
                "payment_method": "upi_simulation"
            }
        )
        
        if success and data:
            print(f"   ✓ Payment Status: {data.get('message', 'N/A')}")
            print(f"   ✓ Policy Status: {data.get('policy_status', 'N/A')}")
            payment_info = data.get('payment', {})
            print(f"   ✓ Payment ID: {payment_info.get('payment_id', 'N/A')}")
            print(f"   ✓ Amount: ₹{payment_info.get('amount', 'N/A')}")
        
        return success

    def test_weather_api(self):
        """Test weather API"""
        cities_to_test = ["Chennai", "Mumbai", "Delhi"]
        
        for city in cities_to_test:
            success, data, response = self.run_test(
                f"Weather for {city}",
                "GET",
                f"weather/{city}",
                200
            )
            
            if success and data:
                current = data.get('current', {})
                forecast = data.get('forecast', {})
                print(f"   ✓ City: {city}")
                print(f"   ✓ Temperature: {current.get('temperature', 'N/A')}°C")
                print(f"   ✓ Description: {current.get('description', 'N/A')}")
                print(f"   ✓ Rainfall: {current.get('rainfall_mm', 'N/A')} mm")
                print(f"   ✓ Wind Speed: {current.get('wind_speed_kmh', 'N/A')} km/h")
                print(f"   ✓ Forecast Rain: {forecast.get('total_rain_mm', 'N/A')} mm")
            print()

    def test_wallet_api(self):
        """Test wallet API"""
        success, data, response = self.run_test(
            "Get Wallet",
            "GET",
            "wallet",
            200
        )
        
        if success and data:
            print(f"   ✓ Total Coins: {data.get('total_coins', 'N/A')}")
            print(f"   ✓ Available Coins: {data.get('available_coins', 'N/A')}")
            print(f"   ✓ Redeemed Coins: {data.get('redeemed_coins', 'N/A')}")
            print(f"   ✓ Cash Value: ₹{data.get('cash_value', 'N/A')}")
        
        return success

    def test_cities_api(self):
        """Test cities API"""
        success, data, response = self.run_test(
            "Get Cities",
            "GET",
            "cities",
            200
        )
        
        if success and data:
            cities = data.get('cities', [])
            print(f"   ✓ Total Cities: {len(cities)}")
            for city in cities[:3]:  # Show first 3
                print(f"   ✓ {city.get('name', 'N/A')} - {city.get('risk', 'N/A')} risk")
            if len(cities) > 3:
                print(f"   ✓ ... and {len(cities) - 3} more cities")
        
        return success

    def test_duplicate_policy_prevention(self):
        """Test that duplicate policies are prevented"""
        # First create a policy
        policy_id = self.test_policy_creation()
        if not policy_id:
            print("❌ Could not create initial policy for duplicate test")
            return False
            
        # Confirm payment to make it active
        payment_success = self.test_payment_confirm(policy_id)
        if not payment_success:
            print("❌ Could not activate policy for duplicate test")
            return False
            
        # Try to create another policy (should fail)
        success, data, response = self.run_test(
            "Duplicate Policy Prevention",
            "POST",
            "policies",
            400,  # Should return 400 for duplicate
            {
                "city": "Chennai",
                "premium": 35.0
            }
        )
        
        if success:
            print("   ✓ Duplicate policy correctly prevented")
        else:
            print("   ⚠️  Duplicate policy prevention may not be working")
        
        return success

    def test_brute_force_protection(self):
        """Test brute force protection on login"""
        print("🔒 Testing Brute Force Protection...")
        
        # Try multiple failed logins
        for i in range(6):  # Try 6 times to trigger lockout
            success, data, response = self.run_test(
                f"Failed Login Attempt {i+1}",
                "POST",
                "auth/login",
                401,  # Should fail
                {
                    "email": "test@example.com",
                    "password": "wrongpassword"
                }
            )
            
            if i == 5:  # 6th attempt should be rate limited
                if response and response.status_code == 429:
                    print("   ✅ Brute force protection working - account locked after 5 attempts")
                    return True
                else:
                    print("   ⚠️  Brute force protection may not be working properly")
                    return False
        
        return False

    # ═══════════════════════════════════════════════════════════════════════
    # MODULE 3 & 4 TESTS: Risk & Severity Engine + Financial Engine
    # ═══════════════════════════════════════════════════════════════════════

    def test_trigger_evaluation_heavy_rain(self):
        """Test trigger evaluation with heavy rain scenario"""
        success, data, response = self.run_test(
            "Trigger Evaluation - Heavy Rain",
            "POST",
            "triggers/evaluate",
            200,
            {
                "city": "Chennai",
                "manual_weather": {
                    "rainfall_mm": 55,
                    "wind_speed_kmh": 25,
                    "temperature": 26,
                    "humidity": 90,
                    "description": "heavy rain"
                }
            }
        )
        
        if success and data:
            print(f"   ✓ Trigger ID: {data.get('trigger_id', 'N/A')}")
            print(f"   ✓ Decision: {data.get('decision', 'N/A')}")
            print(f"   ✓ Weather Severity: {data.get('weather_severity', {}).get('severity', 'N/A')}")
            
            # Check if claim was auto-processed
            claim = data.get('claim')
            if claim:
                print(f"   ✓ Claim Status: {claim.get('status', 'N/A')}")
                print(f"   ✓ Payout: ₹{claim.get('payout', 0)}")
            
            # Check if rewards were given
            reward = data.get('reward')
            if reward:
                print(f"   ✓ Reward Coins: {reward.get('total_coins', 0)}")
        
        return success

    def test_trigger_evaluation_extreme_heat(self):
        """Test trigger evaluation with extreme heat scenario"""
        success, data, response = self.run_test(
            "Trigger Evaluation - Extreme Heat",
            "POST",
            "triggers/evaluate",
            200,
            {
                "city": "Chennai",
                "manual_weather": {
                    "rainfall_mm": 0,
                    "wind_speed_kmh": 8,
                    "temperature": 43,
                    "humidity": 30,
                    "description": "extreme heat"
                }
            }
        )
        
        if success and data:
            print(f"   ✓ Decision: {data.get('decision', 'N/A')}")
            reward = data.get('reward')
            if reward:
                print(f"   ✓ Reward Coins: {reward.get('total_coins', 0)} (expected ~70)")
                for trigger in reward.get('triggers', []):
                    print(f"     - {trigger.get('detail', 'N/A')}: +{trigger.get('coins', 0)} coins")
        
        return success

    def test_trigger_evaluation_cyclone(self):
        """Test trigger evaluation with cyclone scenario"""
        success, data, response = self.run_test(
            "Trigger Evaluation - Cyclone",
            "POST",
            "triggers/evaluate",
            200,
            {
                "city": "Chennai",
                "manual_weather": {
                    "rainfall_mm": 85,
                    "wind_speed_kmh": 55,
                    "temperature": 24,
                    "humidity": 95,
                    "description": "cyclone conditions"
                }
            }
        )
        
        if success and data:
            print(f"   ✓ Decision: {data.get('decision', 'N/A')}")
            print(f"   ✓ Weather Severity: {data.get('weather_severity', {}).get('severity', 'N/A')} (expected: extreme)")
            
            claim = data.get('claim')
            if claim:
                print(f"   ✓ Claim Status: {claim.get('status', 'N/A')}")
                print(f"   ✓ Payout: ₹{claim.get('payout', 0)}")
        
        return success

    def test_trigger_evaluation_live_weather(self):
        """Test trigger evaluation with live weather (no manual override)"""
        success, data, response = self.run_test(
            "Trigger Evaluation - Live Weather",
            "POST",
            "triggers/evaluate",
            200,
            {"city": "Chennai"}
        )
        
        if success and data:
            print(f"   ✓ Decision: {data.get('decision', 'N/A')}")
            weather = data.get('weather_data', {})
            print(f"   ✓ Live Weather Source: {weather.get('source', 'N/A')}")
            print(f"   ✓ Temperature: {weather.get('temperature', 'N/A')}°C")
            print(f"   ✓ Rainfall: {weather.get('rainfall_mm', 'N/A')}mm")
        
        return success

    def test_duplicate_claim_fraud_detection(self):
        """Test that duplicate claims within 24h are rejected"""
        # First trigger evaluation
        success1, data1, response1 = self.run_test(
            "First Trigger Evaluation",
            "POST",
            "triggers/evaluate",
            200,
            {
                "city": "Chennai",
                "manual_weather": {
                    "rainfall_mm": 60,
                    "wind_speed_kmh": 30,
                    "temperature": 25,
                    "humidity": 85,
                    "description": "heavy rain"
                }
            }
        )
        
        if not success1:
            print("   ❌ First trigger evaluation failed")
            return False
        
        # Wait a moment then try again (should be rejected for fraud)
        time.sleep(1)
        
        success2, data2, response2 = self.run_test(
            "Duplicate Claim Detection",
            "POST",
            "triggers/evaluate",
            200,
            {
                "city": "Chennai",
                "manual_weather": {
                    "rainfall_mm": 65,
                    "wind_speed_kmh": 35,
                    "temperature": 24,
                    "humidity": 90,
                    "description": "heavy rain"
                }
            }
        )
        
        if success2 and data2:
            claim = data2.get('claim')
            if claim and claim.get('status') == 'rejected':
                fraud_flags = claim.get('fraud_check', {}).get('flags', [])
                if 'duplicate_claim_24h' in fraud_flags:
                    print("   ✅ Duplicate claim correctly rejected for fraud")
                    return True
                else:
                    print("   ⚠️  Claim rejected but not for duplicate fraud")
            else:
                print("   ⚠️  Duplicate claim was not rejected")
        
        return False

    def test_claims_history(self):
        """Test claims history endpoint"""
        success, data, response = self.run_test(
            "Claims History",
            "GET",
            "claims/history",
            200
        )
        
        if success and data:
            claims = data.get('claims', [])
            print(f"   ✓ Total Claims: {len(claims)}")
            print(f"   ✓ Total Payout: ₹{data.get('total_payout', 0)}")
            print(f"   ✓ Approved: {data.get('approved_count', 0)}")
            print(f"   ✓ Rejected: {data.get('rejected_count', 0)}")
            
            # Show recent claims
            for i, claim in enumerate(claims[:2]):
                print(f"     - {claim.get('claim_id', 'N/A')}: {claim.get('status', 'N/A')} (₹{claim.get('payout', 0)})")
        
        return success

    def test_rewards_history(self):
        """Test rewards history endpoint"""
        success, data, response = self.run_test(
            "Rewards History",
            "GET",
            "rewards/history",
            200
        )
        
        if success and data:
            rewards = data.get('rewards', [])
            print(f"   ✓ Total Rewards: {len(rewards)}")
            print(f"   ✓ Total Earned: {data.get('total_earned', 0)} coins")
            
            # Show recent rewards
            for i, reward in enumerate(rewards[:2]):
                print(f"     - {reward.get('reward_id', 'N/A')}: +{reward.get('total_coins', 0)} coins")
        
        return success

    def test_triggers_history(self):
        """Test triggers history endpoint"""
        success, data, response = self.run_test(
            "Triggers History",
            "GET",
            "triggers/history",
            200
        )
        
        if success and data:
            triggers = data.get('triggers', [])
            print(f"   ✓ Total Triggers: {len(triggers)}")
            
            # Show recent triggers
            for i, trigger in enumerate(triggers[:2]):
                print(f"     - {trigger.get('trigger_id', 'N/A')}: {trigger.get('decision', 'N/A')}")
        
        return success

    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        success, data, response = self.run_test(
            "Dashboard Summary",
            "GET",
            "dashboard/summary",
            200
        )
        
        if success and data:
            print(f"   ✓ Has Active Policy: {data.get('has_active_policy', False)}")
            print(f"   ✓ Total Payout: ₹{data.get('total_payout', 0)}")
            print(f"   ✓ Total Claims: {data.get('total_claims', 0)}")
            print(f"   ✓ Approved Claims: {data.get('approved_claims', 0)}")
            print(f"   ✓ Total Coins Earned: {data.get('total_coins_earned', 0)}")
            print(f"   ✓ Available Coins: {data.get('available_coins', 0)}")
            print(f"   ✓ Wallet Balance: ₹{data.get('wallet_balance', 0)}")
            
            # Check if policy details are included
            policy = data.get('policy')
            if policy:
                print(f"   ✓ Policy ID: {policy.get('policy_id', 'N/A')}")
        
        return success

    def test_wallet_redeem_success(self):
        """Test successful coin redemption"""
        success, data, response = self.run_test(
            "Redeem 100 Coins",
            "POST",
            "wallet/redeem",
            200,
            {"coins": 100}
        )
        
        if success and data:
            redemption = data.get('redemption', {})
            print(f"   ✓ Redemption ID: {redemption.get('redemption_id', 'N/A')}")
            print(f"   ✓ Coins Redeemed: {redemption.get('coins_redeemed', 0)}")
            print(f"   ✓ Cash Value: ₹{redemption.get('cash_value', 0)}")
        
        return success

    def test_wallet_redeem_insufficient(self):
        """Test redemption with insufficient coins"""
        success, data, response = self.run_test(
            "Redeem Insufficient Coins",
            "POST",
            "wallet/redeem",
            400,  # Should fail
            {"coins": 10000}  # Large amount
        )
        
        if success:
            print("   ✅ Insufficient coins correctly rejected")
        
        return success

    def test_severity_endpoint(self):
        """Test severity classification endpoint"""
        success, data, response = self.run_test(
            "Get Severity",
            "POST",
            "severity",
            200
        )
        
        if success and data:
            weather = data.get('weather', {})
            severity = data.get('severity', {})
            ai_assessment = data.get('ai_assessment', {})
            
            print(f"   ✓ Current Severity: {severity.get('severity', 'N/A')}")
            print(f"   ✓ Trigger Type: {severity.get('trigger', 'N/A')}")
            print(f"   ✓ AI Risk Score: {ai_assessment.get('risk_score', 'N/A')}/100")
            print(f"   ✓ Weather Source: {weather.get('source', 'N/A')}")
        
        return success

    def test_risk_score_endpoint(self):
        """Test risk score calculation endpoint"""
        success, data, response = self.run_test(
            "Get Risk Score",
            "POST",
            "risk-score",
            200
        )
        
        if success and data:
            print(f"   ✓ Risk Score: {data.get('risk_score', 'N/A')}/100")
            print(f"   ✓ Risk Level: {data.get('risk_level', 'N/A')}")
            
            ai_assessment = data.get('ai_assessment', {})
            print(f"   ✓ AI Assessment: {ai_assessment.get('assessment', 'N/A')[:50]}...")
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🧪 AUTHENTICATION TESTS")
        print("-" * 30)
        
        # Test registration
        self.test_auth_register()
        
        # Test admin login
        admin_token = self.test_auth_login_admin()
        
        # Test /auth/me
        self.test_auth_me()
        
        # Test rider login
        rider_token = self.test_auth_login_rider()
        
        print("\n🧪 CORE API TESTS (Module 1)")
        print("-" * 30)
        
        # Test pricing API
        self.test_pricing_api()
        
        # Test policy creation and payment
        policy_id = self.test_policy_creation()
        if policy_id:
            self.test_payment_confirm(policy_id)
        
        # Test active policy check
        self.test_active_policy()
        
        # Test weather API
        self.test_weather_api()
        
        # Test wallet API
        self.test_wallet_api()
        
        # Test cities API
        self.test_cities_api()
        
        print("\n🧪 MODULE 3 & 4 TESTS: Risk & Severity + Financial Engine")
        print("-" * 60)
        
        # Test trigger evaluations with different scenarios
        self.test_trigger_evaluation_heavy_rain()
        self.test_trigger_evaluation_extreme_heat()
        self.test_trigger_evaluation_cyclone()
        self.test_trigger_evaluation_live_weather()
        
        # Test fraud detection
        self.test_duplicate_claim_fraud_detection()
        
        # Test history endpoints
        self.test_claims_history()
        self.test_rewards_history()
        self.test_triggers_history()
        
        # Test dashboard summary
        self.test_dashboard_summary()
        
        # Test wallet redemption
        self.test_wallet_redeem_success()
        self.test_wallet_redeem_insufficient()
        
        # Test severity and risk endpoints
        self.test_severity_endpoint()
        self.test_risk_score_endpoint()
        
        print("\n🧪 SECURITY & EDGE CASE TESTS")
        print("-" * 30)
        
        # Test duplicate policy prevention
        self.test_duplicate_policy_prevention()
        
        # Test brute force protection
        self.test_brute_force_protection()
        
        # Test logout
        self.test_auth_logout()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        # Show failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test_name']} - {test['method']} {test['endpoint']}")
                if test['error']:
                    print(f"     Error: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = GigInsureAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())