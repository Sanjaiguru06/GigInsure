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
        
        print("\n🧪 CORE API TESTS")
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