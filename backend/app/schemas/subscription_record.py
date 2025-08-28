from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SubscriptionRecordBase(BaseModel):
    user_id: int
    plan_type: str
    status: str
    amount: Optional[int] = None
    currency: Optional[str] = "INR"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    razorpay_customer_id: Optional[str] = None
    end_date: Optional[datetime] = None


class SubscriptionRecordCreate(SubscriptionRecordBase):
    pass


class SubscriptionRecordUpdate(BaseModel):
    plan_type: Optional[str] = None
    status: Optional[str] = None
    amount: Optional[int] = None
    currency: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    razorpay_customer_id: Optional[str] = None
    end_date: Optional[datetime] = None


class SubscriptionRecordResponse(SubscriptionRecordBase):
    id: int
    start_date: datetime
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


