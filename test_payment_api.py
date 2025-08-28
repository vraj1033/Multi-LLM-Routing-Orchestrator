#!/usr/bin/env python3
"""
Quick test script to fix the 422 error and test payment API correctly.

This script shows how to make proper API requests instead of running log messages as commands.
"""

import requests
import json

def test_payment_api():
    """Test the payment API with correct request format"""
    
    print("🔧 Testing Payment API - Fixing 422 Error")
    print("=" * 50)
    
    # API endpoint
    url = "http://localhost:8000/api/verify-payment"
    
    # Correct request payload
    payload = {
        "razorpay_order_id": "order_test123",
        "razorpay_payment_id": "pay_test456",
        "razorpay_signature": "test_signature_hash",
        "plan_id": "pro",
        "user_id": 1
    }
    
    print(f"🌐 Making request to: {url}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        # Make the API request
        response = requests.post(
            url, 
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📄 Response Body: {response.text}")
        
        if response.status_code == 422:
            print("\n❌ 422 Error - Request validation failed!")
            print("Check that your request includes all required fields:")
            print("- razorpay_order_id (string)")
            print("- razorpay_payment_id (string)")  
            print("- razorpay_signature (string)")
            print("- plan_id (must be: free, basic, pro, enterprise)")
            print("- user_id (positive integer)")
        elif response.status_code == 200:
            print("✅ Request successful!")
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error - Is the server running?")
        print("Start the server with: cd backend && uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Error: {e}")

def show_correct_curl_example():
    """Show the correct way to test with cURL"""
    print("\n" + "=" * 50)
    print("🔧 CORRECT WAY TO TEST WITH cURL:")
    print("=" * 50)
    
    curl_command = '''curl -X POST "http://localhost:8000/api/verify-payment" \\
  -H "Content-Type: application/json" \\
  -d '{
    "razorpay_order_id": "order_test123",
    "razorpay_payment_id": "pay_test456",
    "razorpay_signature": "test_signature_hash",
    "plan_id": "pro",
    "user_id": 1
  }' '''
    
    print("Copy this command to test:")
    print(curl_command)

def explain_log_vs_command():
    """Explain the difference between log messages and commands"""
    print("\n" + "=" * 50) 
    print("📝 LOG MESSAGE vs COMMAND:")
    print("=" * 50)
    
    print("\n❌ DON'T RUN THIS (it's a log message):")
    print("INFO:     127.0.0.1:51685 - \"POST /api/verify-payment HTTP/1.1\" 422 Unprocessable Entity")
    
    print("\n✅ DO RUN THIS (it's a command):")
    print("python test_payment_api.py")
    
    print("\n📋 Log messages tell you what happened:")
    print("- INFO: = Log level")
    print("- 127.0.0.1:51685 = Client IP and port")  
    print("- POST /api/verify-payment = HTTP method and endpoint")
    print("- 422 Unprocessable Entity = Response status")
    
    print("\n🎯 Commands actually do something:")
    print("- python script.py = Run a Python script")
    print("- curl -X POST ... = Make an HTTP request")
    print("- cd backend = Change directory")

if __name__ == "__main__":
    explain_log_vs_command()
    test_payment_api()
    show_correct_curl_example()
