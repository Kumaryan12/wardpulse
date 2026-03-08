from pydantic import BaseModel
from datetime import datetime


class ImpactReportResponse(BaseModel):
    id: int
    ticket_id: int
    before_pm25_avg: float
    after_pm25_avg: float
    before_pm10_avg: float
    after_pm10_avg: float
    improvement_percent: float
    effectiveness_score: float
    verdict: str
    created_at: datetime

    class Config:
        from_attributes = True