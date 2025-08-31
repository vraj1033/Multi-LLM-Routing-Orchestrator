from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, validator
import razorpay
import hmac
import hashlib
from typing import Optional
from datetime import datetime, timedelta
from ..core.config import settings
from ..core.database import get_db
from ..services.subscription_record import SubscriptionRecordService


router = APIRouter()

# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(
        settings.razorpay_key_id,
        settings.razorpay_key_secret
    )
)

class CreateOrderRequest(BaseModel):
    amount: int  # Amount in paise
    currency: str = "INR"
    plan_id: str
    user_id: int

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: str
    user_id: int
    
    @validator('plan_id')
    def validate_plan_id(cls, v):
        valid_plans = ['free', 'basic', 'pro', 'enterprise']
        if v.lower() not in valid_plans:
            raise ValueError(f'plan_id must be one of: {valid_plans}')
        return v.lower()
    
    @validator('user_id')
    def validate_user_id(cls, v):
        if v <= 0:
            raise ValueError('user_id must be a positive integer')
        return v
    
    @validator('razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature')
    def validate_razorpay_fields(cls, v):
        if not v or not v.strip():
            raise ValueError('Razorpay fields cannot be empty')
        return v.strip()

@router.post("/create-order")
async def create_order(request: CreateOrderRequest):
    """Create a Razorpay order for payment"""
    try:
        order_data = {
            "amount": request.amount,
            "currency": request.currency,
            "receipt": f"order_{request.plan_id}_{request.amount}",
            "notes": {
                "plan_id": request.plan_id,
                "user_id": str(request.user_id)
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        return {
            "success": True,
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@router.post("/verify-payment")
async def verify_payment(request: VerifyPaymentRequest, db: AsyncSession = Depends(get_db)):
    """Verify Razorpay payment signature and update subscription"""
    try:
        # Create signature for verification
        generated_signature = hmac.new(
            key=settings.razorpay_key_secret.encode(),
            msg=f"{request.razorpay_order_id}|{request.razorpay_payment_id}".encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        if generated_signature == request.razorpay_signature:
            # Payment is verified - create a subscription record
            plan_id = request.plan_id.lower()
            if plan_id not in ["free", "basic", "pro", "enterprise"]:
                raise HTTPException(status_code=400, detail=f"Invalid plan_id: {request.plan_id}")

            end_date = datetime.utcnow() + timedelta(days=30) if plan_id != "free" else None

            from ..schemas.subscription_record import SubscriptionRecordCreate
            record = await SubscriptionRecordService.create_record(
                db,
                SubscriptionRecordCreate(
                    user_id=request.user_id,
                    plan_type=plan_id,
                    status="active",
                    amount=None,
                    currency="INR",
                    razorpay_order_id=request.razorpay_order_id,
                    razorpay_payment_id=request.razorpay_payment_id,
                    razorpay_signature=request.razorpay_signature,
                    end_date=end_date
                )
            )

            return {
                "success": True,
                "message": "Payment verified and subscription record created",
                "record": {
                    "id": record.id,
                    "plan_type": record.plan_type,
                    "status": record.status,
                    "razorpay_payment_id": record.razorpay_payment_id,
                    "end_date": record.end_date.isoformat() if record.end_date else None
                }
            }
        else:
            return {
                "success": False,
                "message": "Payment verification failed - invalid signature"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

class UpdateSubscriptionRequest(BaseModel):
    user_id: int
    plan_id: str
    razorpay_payment_id: Optional[str] = None
    status: str = "active"

@router.post("/update-subscription")
async def update_subscription(request: UpdateSubscriptionRequest, db: AsyncSession = Depends(get_db)):
    """Create a new subscription record to reflect a manual update"""
    try:
        plan_id = request.plan_id.lower()
        if plan_id not in ["free", "basic", "pro", "enterprise"]:
            raise HTTPException(status_code=400, detail=f"Invalid plan_id: {request.plan_id}")

        end_date = datetime.utcnow() + timedelta(days=30) if plan_id != "free" else None
        from ..schemas.subscription_record import SubscriptionRecordCreate
        record = await SubscriptionRecordService.create_record(
            db,
            SubscriptionRecordCreate(
                user_id=request.user_id,
                plan_type=plan_id,
                status=request.status.lower(),
                razorpay_payment_id=request.razorpay_payment_id,
                end_date=end_date
            )
        )
        return {
            "success": True,
            "message": "Subscription record created",
            "record": {
                "id": record.id,
                "plan_type": record.plan_type,
                "status": record.status
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update subscription: {str(e)}")

@router.post("/create-free-subscription")
async def create_free_subscription(user_id: int, db: AsyncSession = Depends(get_db)):
    """Create a free subscription record for new users"""
    try:
        from ..schemas.subscription_record import SubscriptionRecordCreate
        record = await SubscriptionRecordService.create_record(
            db,
            SubscriptionRecordCreate(
                user_id=user_id,
                plan_type="free",
                status="active"
            )
        )
        return {
            "success": True,
            "message": "Free subscription record created",
            "record": {
                "id": record.id,
                "plan_type": record.plan_type,
                "status": record.status,
                "user_id": record.user_id,
                "start_date": record.start_date.isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create free subscription: {str(e)}")

@router.get("/plans")
async def get_pricing_plans():
    """Get available pricing plans"""
    plans = [
        {
            "id": "free",
            "name": "Free",
            "price": 0,
            "period": "forever",
            "features": [
                "100 AI requests per month",
                "Basic chat functionality",
                "Standard response time",
                "Community support",
                "Basic analytics"
            ]
        },
        {
            "id": "pro",
            "name": "Pro",
            "price": 999,
            "original_price": 1499,
            "period": "month",
            "features": [
                "10,000 AI requests per month",
                "Priority response time",
                "Advanced chat features",
                "Custom AI models",
                "Priority support",
                "Advanced analytics",
                "API access",
                "Custom integrations"
            ],
            "popular": True
        },
        {
            "id": "enterprise",
            "name": "Enterprise",
            "price": 4999,
            "original_price": 7499,
            "period": "month",
            "features": [
                "Unlimited AI requests",
                "Fastest response time",
                "All Pro features",
                "Dedicated support",
                "Custom deployment",
                "Advanced security",
                "SLA guarantee",
                "Custom training",
                "White-label solution"
            ]
        }
    ]
    
    return {"plans": plans}