from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime


class MetricsSummary(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    avg_latency_ms: float
    total_tokens: int
    requests_by_model: Dict[str, int]
    requests_by_provider: Dict[str, int]


class TimeSeriesPoint(BaseModel):
    timestamp: datetime
    requests: int
    avg_latency: float


class MetricsSeries(BaseModel):
    requests_over_time: List[TimeSeriesPoint]
    latency_by_model: Dict[str, List[TimeSeriesPoint]]







