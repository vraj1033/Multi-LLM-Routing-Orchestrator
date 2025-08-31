from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from ..core.database import get_db
from ..models.user import User
from ..models.search import RecentSearch
from ..schemas.search import SearchCreate, SearchResponse, SearchListResponse
from ..api.auth import get_current_user

router = APIRouter(prefix="/searches", tags=["searches"])


@router.get("/recent", response_model=SearchListResponse)
async def get_recent_searches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20
):
    """Get user's recent searches"""
    
    try:
        # Get recent searches for the user
        result = await db.execute(
            select(RecentSearch)
            .where(RecentSearch.user_id == current_user.id)
            .order_by(desc(RecentSearch.created_at))
            .limit(limit)
        )
        
        searches = result.scalars().all()
        
        return SearchListResponse(
            searches=searches,
            total=len(searches)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recent searches: {str(e)}"
        )


@router.post("/", response_model=SearchResponse)
async def create_search(
    search_data: SearchCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save a new search"""
    
    try:
        # Create new search
        new_search = RecentSearch(
            user_id=current_user.id,
            query=search_data.query
        )
        
        db.add(new_search)
        await db.commit()
        await db.refresh(new_search)
        
        return new_search
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save search: {str(e)}"
        )


@router.delete("/{search_id}")
async def delete_search(
    search_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a specific search"""
    
    try:
        # Find search and verify ownership
        result = await db.execute(
            select(RecentSearch)
            .where(RecentSearch.id == search_id)
            .where(RecentSearch.user_id == current_user.id)
        )
        
        search = result.scalar_one_or_none()
        
        if not search:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Search not found"
            )
        
        # Delete search
        await db.delete(search)
        await db.commit()
        
        return {"message": "Search deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete search: {str(e)}"
        )







