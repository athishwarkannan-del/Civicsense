import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_auth_flow():
    # 1. Register
    reg_url = f"{BASE_URL}/auth/register"
    reg_payload = {
        "email": "test_agent@example.com",
        "full_name": "Agent Test",
        "password": "Password123!",
        "role": "user"
    }
    headers = {'Content-Type': 'application/json'}
    
    print(f"Testing Registration: {reg_url}")
    try:
        response = requests.post(reg_url, data=json.dumps(reg_payload), headers=headers)
        print(f"Reg Status: {response.status_code}")
        print(f"Reg Response: {response.text}")
    except Exception as e:
        print(f"Reg Error: {e}")

    # 2. Login
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {
        "email": "test_agent@example.com",
        "password": "Password123!"
    }
    
    print(f"\nTesting Login: {login_url}")
    try:
        response = requests.post(login_url, data=json.dumps(login_payload), headers=headers)
        print(f"Login Status: {response.status_code}")
        print(f"Login Response: {response.text}")
    except Exception as e:
        print(f"Login Error: {e}")

if __name__ == "__main__":
    test_auth_flow()
