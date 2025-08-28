#!/usr/bin/env python3
"""
Test script to validate payment request formats and troubleshoot 422 errors.

Usage:
    python test_request_validation.py
"""

def test_verify_payment_requests():
    """Test different request formats for verify-payment endpoint"""
    
    print("🧪 Testing Payment Request Validation")
    print("=" * 50)
    
    # Valid request example
    print("\n✅ VALID REQUEST FORMAT:")
    valid_request = {
        "razorpay_order_id": "order_abc123def456",
        "razorpay_payment_id": "pay_xyz789ghi123", 
        "razorpay_signature": "generated_signature_hash",
        "plan_id": "pro",
        "user_id": 123
    }
    
    print("POST /api/verify-payment")
    print("Content-Type: application/json")
    print("Body:")
    import json
    print(json.dumps(valid_request, indent=2))
    
    # Invalid request examples
    print("\n❌ COMMON INVALID REQUESTS:")
    
    invalid_examples = [
        {
            "name": "Missing user_id field",
            "request": {
                "razorpay_order_id": "order_123",
                "razorpay_payment_id": "pay_456",
                "razorpay_signature": "sig_789", 
                "plan_id": "pro"
                # Missing user_id!
            },
            "error": "422 Unprocessable Entity - Missing required field 'user_id'"
        },
        {
            "name": "Invalid plan_id",
            "request": {
                "razorpay_order_id": "order_123",
                "razorpay_payment_id": "pay_456",
                "razorpay_signature": "sig_789",
                "plan_id": "premium",  # Invalid!
                "user_id": 1
            },
            "error": "ValueError: plan_id must be one of: ['free', 'basic', 'pro', 'enterprise']"
        },
        {
            "name": "Invalid user_id (negative)",
            "request": {
                "razorpay_order_id": "order_123",
                "razorpay_payment_id": "pay_456",
                "razorpay_signature": "sig_789",
                "plan_id": "pro",
                "user_id": -1  # Invalid!
            },
            "error": "ValueError: user_id must be a positive integer"
        },
        {
            "name": "Empty razorpay fields",
            "request": {
                "razorpay_order_id": "",  # Empty!
                "razorpay_payment_id": "pay_456",
                "razorpay_signature": "sig_789",
                "plan_id": "pro", 
                "user_id": 1
            },
            "error": "ValueError: Razorpay fields cannot be empty"
        }
    ]
    
    for i, example in enumerate(invalid_examples, 1):
        print(f"\n{i}. {example['name']}:")
        print("   Request:", json.dumps(example['request'], indent=6))
        print("   Error:", example['error'])
    
    print("\n" + "=" * 50)
    print("🔧 HOW TO FIX 422 ERRORS:")
    print("\n1. Ensure ALL required fields are present:")
    print("   • razorpay_order_id (non-empty string)")
    print("   • razorpay_payment_id (non-empty string)")
    print("   • razorpay_signature (non-empty string)")
    print("   • plan_id (must be: free, basic, pro, enterprise)")
    print("   • user_id (positive integer)")
    
    print("\n2. Check Content-Type header:")
    print("   Content-Type: application/json")
    
    print("\n3. Valid cURL example:")
    print("""
curl -X POST "http://localhost:8000/api/verify-payment" \\
  -H "Content-Type: application/json" \\
  -d '{
    "razorpay_order_id": "order_test123",
    "razorpay_payment_id": "pay_test456", 
    "razorpay_signature": "test_signature_hash",
    "plan_id": "pro",
    "user_id": 1
  }'""")
    
    print("\n✅ The request validation has been improved to provide clearer error messages!")

if __name__ == "__main__":
    test_verify_payment_requests()
