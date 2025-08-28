from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    searches = relationship("RecentSearch", back_populates="user", cascade="all, delete-orphan")
    requests = relationship("Request", back_populates="user", cascade="all, delete-orphan")
    routing_policy = relationship("RoutingPolicy", back_populates="user", uselist=False, cascade="all, delete-orphan")
    subscription_records = relationship("SubscriptionRecord", back_populates="user", cascade="all, delete-orphan")

# Fix circular import for SQLAlchemy relationship
from .routing_policy import RoutingPolicy
from .subscription_record import SubscriptionRecord
