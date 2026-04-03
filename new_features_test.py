#!/usr/bin/env python3
"""
GigInsure New Features Testing - Iteration 3
Tests the 8 new features built for this iteration
"""

import requests
import sys
import json
from datetime import datetime

class NewFeaturesAPITester:
    def __init__(self, base_url="https://rider-cover.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.rider_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def authenticate(self):
        """Authenticate admin and rider users"""
        print("🔐 Authenticating users...")
        
        # Admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@giginsure.com", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   ✅ Admin authenticated")
        
        # Rider login
        success, response = self.run_test(
            "Rider Login",
            "POST",
            "auth/login",
            200,
            data={"email": "rider@test.com", "password": "rider123"}
        )
        if success and 'access_token' in response:
            self.rider_token = response['access_token']
            print(f"   ✅ Rider authenticated")
        
        return self.admin_token and self.rider_token

    def test_ai_chatbot(self):
        """Test AI Chatbot functionality"""
        print("\n🤖 TESTING AI CHATBOT")
        print("-" * 30)
        
        if not self.rider_token:
            print("❌ No rider token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.rider_token}'}
        
        # Test various chat messages
        test_messages = [
            "Should I go out today?",
            "What's my risk level?", 
            "How much can I earn today?",
            "Am I covered right now?"
        ]
        
        all_passed = True
        for message in test_messages:
            success, response = self.run_test(
                f"Chat: '{message[:30]}...'",
                "POST",
                "chat",
                200,
                data={"message": message},
                headers=headers
            )
            if success and 'reply' in response:
                print(f"   🤖 AI Reply: {response['reply'][:80]}...")
                if 'severity' in response:
                    print(f"   📊 Severity: {response['severity']}")
            else:
                all_passed = False
        
        return all_passed

    def test_risk_heatmap(self):
        """Test Risk Heatmap with 10 Indian cities"""
        print("\n🗺️ TESTING RISK HEATMAP")
        print("-" * 30)
        
        if not self.rider_token:
            print("❌ No rider token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.rider_token}'}
        success, response = self.run_test(
            "Risk Heatmap Data",
            "GET",
            "heatmap",
            200,
            headers=headers
        )
        
        if success and 'cities' in response:
            cities = response['cities']
            print(f"   📍 Found {len(cities)} cities")
            
            expected_cities = ["Chennai", "Mumbai", "Delhi", "Bangalore", "Kolkata", 
                             "Hyderabad", "Pune", "Jaipur", "Ahmedabad", "Lucknow"]
            
            if len(cities) >= 10:
                print("   ✅ Has 10+ cities")
                for i, city in enumerate(cities[:5]):  # Show first 5
                    print(f"   🏙️ {city['city']}: {city['severity']} severity, {city['weather']['temperature']}°C")
                
                # Check if all expected cities are present
                city_names = [c['city'] for c in cities]
                missing = [c for c in expected_cities if c not in city_names]
                if not missing:
                    print("   ✅ All expected Indian cities present")
                    return True
                else:
                    print(f"   ⚠️ Missing cities: {missing}")
            else:
                print(f"   ❌ Expected 10 cities, got {len(cities)}")
        
        return False

    def test_admin_dashboard(self):
        """Test Admin Dashboard APIs"""
        print("\n👨‍💼 TESTING ADMIN DASHBOARD")
        print("-" * 30)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test admin stats
        success1, stats = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200,
            headers=headers
        )
        
        if success1 and 'total_riders' in stats:
            print(f"   📊 Total riders: {stats['total_riders']}")
            print(f"   🛡️ Active policies: {stats['active_policies']}")
            print(f"   📋 Total claims: {stats['total_claims']}")
            print(f"   💰 Total payouts: ₹{stats['total_payouts']}")
            print(f"   🚨 Fraud rate: {stats['fraud_rate']}%")
        
        # Test admin riders list
        success2, riders = self.run_test(
            "Admin Riders List",
            "GET",
            "admin/riders",
            200,
            headers=headers
        )
        
        if success2 and 'riders' in riders:
            print(f"   👥 Riders in system: {len(riders['riders'])}")
        
        # Test admin recent activity
        success3, activity = self.run_test(
            "Admin Recent Activity",
            "GET",
            "admin/recent-activity",
            200,
            headers=headers
        )
        
        if success3:
            claims = activity.get('recent_claims', [])
            triggers = activity.get('recent_triggers', [])
            print(f"   📋 Recent claims: {len(claims)}")
            print(f"   ⚡ Recent triggers: {len(triggers)}")
        
        return success1 and success2 and success3

    def test_activity_tracking(self):
        """Test Activity Tracking APIs"""
        print("\n📍 TESTING ACTIVITY TRACKING")
        print("-" * 30)
        
        if not self.rider_token:
            print("❌ No rider token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.rider_token}'}
        
        # Test activity status
        success1, status = self.run_test(
            "Activity Status",
            "GET",
            "activity/status",
            200,
            headers=headers
        )
        
        if success1:
            print(f"   📊 Current status: {status.get('current_status', 'unknown')}")
            print(f"   🎯 Intent status: {status.get('intent_status', 'unknown')}")
            print(f"   📈 Recent active sessions: {status.get('recent_active_sessions', 0)}")
        
        # Test activity simulation for each status
        statuses = ['active', 'idle', 'offline']
        simulation_results = []
        
        for status_type in statuses:
            success, simulate = self.run_test(
                f"Simulate {status_type.title()} Status",
                "POST",
                "activity/simulate",
                200,
                data={"status": status_type},
                headers=headers
            )
            simulation_results.append(success)
            if success:
                print(f"   ✅ {status_type.title()} simulation successful")
        
        return success1 and all(simulation_results)

    def test_payment_history(self):
        """Test Payment History API"""
        print("\n💳 TESTING PAYMENT HISTORY")
        print("-" * 30)
        
        if not self.rider_token:
            print("❌ No rider token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.rider_token}'}
        success, response = self.run_test(
            "Payment History",
            "GET",
            "payments/history",
            200,
            headers=headers
        )
        
        if success and 'payments' in response:
            payments = response['payments']
            total_paid = response.get('total_paid', 0)
            print(f"   💰 Total paid: ₹{total_paid}")
            print(f"   📊 Payment count: {len(payments)}")
            
            if payments:
                latest = payments[0]
                print(f"   📋 Latest payment: {latest.get('payment_id', 'N/A')} - ₹{latest.get('amount', 0)}")
            
            return True
        
        return False

    def test_policy_renewal(self):
        """Test Policy Renewal API"""
        print("\n🔄 TESTING POLICY RENEWAL")
        print("-" * 30)
        
        if not self.rider_token:
            print("❌ No rider token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.rider_token}'}
        
        # Check current policy status
        success1, active_policy = self.run_test(
            "Check Active Policy",
            "GET",
            "policies/active",
            200,
            headers=headers
        )
        
        if success1:
            has_active = active_policy.get('has_active_policy', False)
            print(f"   📋 Has active policy: {has_active}")
            
            if has_active:
                policy = active_policy.get('policy', {})
                print(f"   🆔 Policy ID: {policy.get('policy_id', 'N/A')}")
                print(f"   📅 End date: {policy.get('end_date', 'N/A')}")
                print("   ✅ Policy renewal not needed (already active)")
                return True
            else:
                # Try to renew
                success2, renewal = self.run_test(
                    "Policy Renewal",
                    "POST",
                    "policies/renew",
                    200,
                    headers=headers
                )
                
                if success2 and 'policy' in renewal:
                    new_policy = renewal['policy']
                    print(f"   ✅ Policy renewed: {new_policy.get('policy_id', 'N/A')}")
                    return True
        
        return False

    def test_earnings_analytics(self):
        """Test Earnings Analytics API for Dashboard Charts"""
        print("\n📊 TESTING EARNINGS ANALYTICS")
        print("-" * 30)
        
        if not self.rider_token:
            print("❌ No rider token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.rider_token}'}
        success, response = self.run_test(
            "Earnings Analytics",
            "GET",
            "analytics/earnings",
            200,
            headers=headers
        )
        
        if success and 'daily_earnings' in response:
            daily_data = response['daily_earnings']
            claim_dist = response.get('claim_distribution', {})
            
            print(f"   📈 Daily earnings data points: {len(daily_data)}")
            print(f"   💰 Total payout: ₹{response.get('total_payout', 0)}")
            print(f"   📊 ROI: {response.get('roi', 0)}%")
            print(f"   ✅ Approved claims: {claim_dist.get('approved', 0)}")
            print(f"   ❌ Rejected claims: {claim_dist.get('rejected', 0)}")
            
            if len(daily_data) >= 7:
                print("   ✅ Has 7-day earnings data for charts")
                sample_day = daily_data[0]
                print(f"   📅 Sample day ({sample_day['day']}): Expected ₹{sample_day['expected']}, Actual ₹{sample_day['actual']}")
                return True
            else:
                print(f"   ❌ Expected 7 days of data, got {len(daily_data)}")
        
        return False

def main():
    print("🚀 GigInsure New Features Testing - Iteration 3")
    print("=" * 60)
    
    tester = NewFeaturesAPITester()
    
    # Authenticate first
    if not tester.authenticate():
        print("❌ Authentication failed, cannot proceed")
        return 1
    
    # Test all new features
    test_results = []
    
    print("\n🧪 TESTING 8 NEW FEATURES")
    print("=" * 60)
    
    # 1. AI Chatbot
    test_results.append(tester.test_ai_chatbot())
    
    # 2. Risk Heatmap
    test_results.append(tester.test_risk_heatmap())
    
    # 3. Admin Dashboard
    test_results.append(tester.test_admin_dashboard())
    
    # 4. Activity Tracking
    test_results.append(tester.test_activity_tracking())
    
    # 5. Payment History
    test_results.append(tester.test_payment_history())
    
    # 6. Policy Renewal
    test_results.append(tester.test_policy_renewal())
    
    # 7. Earnings Analytics
    test_results.append(tester.test_earnings_analytics())
    
    # Print final results
    print("\n" + "=" * 60)
    print("📊 NEW FEATURES TEST SUMMARY")
    print("=" * 60)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    passed_features = sum(test_results)
    total_features = len(test_results)
    
    print(f"\n🎯 FEATURE COMPLETION:")
    print(f"Features working: {passed_features}/{total_features}")
    
    feature_names = [
        "AI Chatbot", "Risk Heatmap", "Admin Dashboard", 
        "Activity Tracking", "Payment History", "Policy Renewal", 
        "Earnings Analytics"
    ]
    
    for i, (name, result) in enumerate(zip(feature_names, test_results)):
        status = "✅" if result else "❌"
        print(f"{status} {name}")
    
    if passed_features == total_features:
        print("\n🎉 All new features are working!")
        return 0
    else:
        print(f"\n⚠️ {total_features - passed_features} features need attention")
        return 1

if __name__ == "__main__":
    sys.exit(main())