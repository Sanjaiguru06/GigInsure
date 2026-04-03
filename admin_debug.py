#!/usr/bin/env python3
"""
Quick Admin Token Debug Test
"""

import requests
import json

def test_admin_auth():
    base_url = "https://rider-cover.preview.emergentagent.com/api"
    
    # Login as admin
    login_response = requests.post(f"{base_url}/auth/login", json={
        "email": "admin@giginsure.com",
        "password": "admin123"
    })
    
    print(f"Login Status: {login_response.status_code}")
    if login_response.status_code == 200:
        login_data = login_response.json()
        print(f"Admin Role: {login_data.get('role')}")
        print(f"Admin Email: {login_data.get('email')}")
        
        # Test /auth/me with token
        token = login_data.get('access_token')
        headers = {'Authorization': f'Bearer {token}'}
        
        me_response = requests.get(f"{base_url}/auth/me", headers=headers)
        print(f"\n/auth/me Status: {me_response.status_code}")
        if me_response.status_code == 200:
            me_data = me_response.json()
            print(f"User Role from /auth/me: {me_data.get('role')}")
            print(f"User ID: {me_data.get('_id')}")
        
        # Test admin stats
        stats_response = requests.get(f"{base_url}/admin/stats", headers=headers)
        print(f"\n/admin/stats Status: {stats_response.status_code}")
        if stats_response.status_code != 200:
            print(f"Error: {stats_response.json()}")
    else:
        print(f"Login failed: {login_response.json()}")

if __name__ == "__main__":
    test_admin_auth()