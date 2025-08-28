from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from ..core.database import get_db
from ..services.subscription_record import SubscriptionRecordService
from ..schemas.subscription_record import SubscriptionRecordResponse, SubscriptionRecordCreate, SubscriptionRecordUpdate

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.get("/user/{user_id}", response_model=Optional[SubscriptionRecordResponse])
async def get_user_subscription(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get latest subscription record for a user"""
    record = await SubscriptionRecordService.get_latest_record_for_user(db, user_id)
    return record


@router.post("/", response_model=SubscriptionRecordResponse)
async def create_subscription(
    subscription_data: SubscriptionRecordCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new subscription record"""
    try:
        record = await SubscriptionRecordService.create_record(db, subscription_data)
        return record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create subscription record: {str(e)}"
        )


@router.put("/{record_id}", response_model=SubscriptionRecordResponse)
async def update_subscription(
    record_id: int,
    update_data: SubscriptionRecordUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update subscription record details"""
    record = await SubscriptionRecordService.update_record(db, record_id, update_data)
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription record not found"
        )
    
    return record


@router.get("/user/{user_id}/records", response_model=List[SubscriptionRecordResponse])
async def list_user_subscription_records(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """List all subscription records for a user"""
    records = await SubscriptionRecordService.list_records_for_user(db, user_id)
    return records


@router.post("/user/{user_id}/cancel", response_model=SubscriptionRecordResponse)
async def cancel_user_subscription(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Create a cancellation record for user's subscription"""
    from ..schemas.subscription_record import SubscriptionRecordCreate
    record = await SubscriptionRecordService.create_record(
        db,
        SubscriptionRecordCreate(
            user_id=user_id,
            plan_type="free",
            status="cancelled"
        )
    )
    return record


@router.get("/razorpay/{razorpay_payment_id}", response_model=Optional[SubscriptionRecordResponse])
async def get_subscription_by_razorpay_id(
    razorpay_payment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get subscription record by Razorpay payment ID"""
    from sqlalchemy import select
    from ..models.subscription_record import SubscriptionRecord
    result = await db.execute(
        select(SubscriptionRecord).where(SubscriptionRecord.razorpay_payment_id == razorpay_payment_id)
    )
    return result.scalar_one_or_none()