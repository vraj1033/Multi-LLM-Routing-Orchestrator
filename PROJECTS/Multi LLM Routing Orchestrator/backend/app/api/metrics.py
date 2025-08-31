from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from ..core.database import get_db
from ..models.user import User
from ..models.request import Request
from ..schemas.metrics import MetricsSummary, MetricsSeries, TimeSeriesPoint
from ..api.auth import get_current_user

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/summary", response_model=MetricsSummary)
async def get_metrics_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get usage metrics summary for the user"""
    
    try:
        # Get total requests
        total_result = await db.execute(
            select(func.count(Request.id))
            .where(Request.user_id == current_user.id)
        )
        total_requests = total_result.scalar() or 0
        
        # Get successful requests
        success_result = await db.execute(
            select(func.count(Request.id))
            .where(Request.user_id == current_user.id)
            .where(Request.status == "success")
        )
        successful_requests = success_result.scalar() or 0
        
        # Get failed requests
        failed_requests = total_requests - successful_requests
        
        # Get average latency
        latency_result = await db.execute(
            select(func.avg(Request.latency_ms))
            .where(Request.user_id == current_user.id)
            .where(Request.status == "success")
            .where(Request.latency_ms.isnot(None))
        )
        avg_latency = latency_result.scalar() or 0.0
        
        # Get requests by model
        model_result = await db.execute(
            select(Request.model, func.count(Request.id))
            .where(Request.user_id == current_user.id)
            .group_by(Request.model)
        )
        requests_by_model = {row[0]: row[1] for row in model_result.fetchall()}
        
        # Get requests by provider
        provider_result = await db.execute(
            select(Request.provider, func.count(Request.id))
            .where(Request.user_id == current_user.id)
            .group_by(Request.provider)
        )
        requests_by_provider = {row[0]: row[1] for row in provider_result.fetchall()}
        
        # Get total tokens (estimate)
        total_tokens = successful_requests * 100  # Rough estimate
        
        return MetricsSummary(
            total_requests=total_requests,
            successful_requests=successful_requests,
            failed_requests=failed_requests,
            avg_latency_ms=round(avg_latency, 2),
            total_tokens=total_tokens,
            requests_by_model=requests_by_model,
            requests_by_provider=requests_by_provider
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get metrics summary: {str(e)}"
        )


@router.get("/series", response_model=MetricsSeries)
async def get_metrics_series(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    days: int = 30
):
    """Get time series metrics data"""
    
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get requests over time (daily aggregation)
        time_result = await db.execute(
            select(
                func.date_trunc('day', Request.created_at).label('day'),
                func.count(Request.id).label('count'),
                func.avg(Request.latency_ms).label('avg_latency')
            )
            .where(Request.user_id == current_user.id)
            .where(Request.created_at >= start_date)
            .group_by(func.date_trunc('day', Request.created_at))
            .order_by(func.date_trunc('day', Request.created_at))
        )
        
        requests_over_time = []
        for row in time_result.fetchall():
            requests_over_time.append(TimeSeriesPoint(
                timestamp=row.day,
                requests=row.count,
                avg_latency=round(row.avg_latency or 0, 2)
            ))
        
        # Get latency by model
        model_latency_result = await db.execute(
            select(
                Request.model,
                func.date_trunc('day', Request.created_at).label('day'),
                func.avg(Request.latency_ms).label('avg_latency')
            )
            .where(Request.user_id == current_user.id)
            .where(Request.created_at >= start_date)
            .where(Request.status == "success")
            .where(Request.latency_ms.isnot(None))
            .group_by(Request.model, func.date_trunc('day', Request.created_at))
            .order_by(func.date_trunc('day', Request.created_at))
        )
        
        latency_by_model = {}
        for row in model_latency_result.fetchall():
            model = row[0]
            if model not in latency_by_model:
                latency_by_model[model] = []
            
            latency_by_model[model].append(TimeSeriesPoint(
                timestamp=row.day,
                requests=1,  # We're not counting here, just tracking latency
                avg_latency=round(row.avg_latency or 0, 2)
            ))
        
        return MetricsSeries(
            requests_over_time=requests_over_time,
            latency_by_model=latency_by_model
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get metrics series: {str(e)}"
        )







