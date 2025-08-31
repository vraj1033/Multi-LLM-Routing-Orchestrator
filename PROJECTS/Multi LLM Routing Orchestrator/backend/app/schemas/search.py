from pydantic import BaseModel
from datetime import datetime


class SearchCreate(BaseModel):
    query: str


class SearchResponse(BaseModel):
    id: int
    query: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class SearchListResponse(BaseModel):
    searches: list[SearchResponse]
    total: int







