from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class RoutingPolicy(Base):
    __tablename__ = "routing_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    preference = Column(String, default="balanced")  # speed, balanced, accuracy
    enabled_providers = Column(JSON, default=dict)  # {"groq": true, "huggingface": true, "ollama": true}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    user = relationship("User", back_populates="routing_policy")







