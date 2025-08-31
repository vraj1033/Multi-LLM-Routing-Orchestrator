from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional, List
from ..models.subscription_record import SubscriptionRecord
from ..schemas.subscription_record import SubscriptionRecordCreate, SubscriptionRecordUpdate


class SubscriptionRecordService:
    
    @staticmethod
    async def create_record(db: AsyncSession, data: SubscriptionRecordCreate) -> SubscriptionRecord:
        record = SubscriptionRecord(**data.dict())
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record
    
    @staticmethod
    async def get_latest_record_for_user(db: AsyncSession, user_id: int) -> Optional[SubscriptionRecord]:
        result = await db.execute(
            select(SubscriptionRecord)
            .where(SubscriptionRecord.user_id == user_id)
            .order_by(desc(SubscriptionRecord.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_records_for_user(db: AsyncSession, user_id: int) -> List[SubscriptionRecord]:
        result = await db.execute(
            select(SubscriptionRecord)
            .where(SubscriptionRecord.user_id == user_id)
            .order_by(desc(SubscriptionRecord.created_at))
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def update_record(db: AsyncSession, record_id: int, update: SubscriptionRecordUpdate) -> Optional[SubscriptionRecord]:
        result = await db.execute(
            select(SubscriptionRecord).where(SubscriptionRecord.id == record_id)
        )
        record = result.scalar_one_or_none()
        if not record:
            return None
        update_dict = update.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(record, field, value)
        await db.commit()
        await db.refresh(record)
        return record


