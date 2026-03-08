from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class ImpactReport(Base):
    __tablename__ = "impact_reports"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)

    before_pm25_avg = Column(Float, nullable=False)
    after_pm25_avg = Column(Float, nullable=False)
    before_pm10_avg = Column(Float, nullable=False)
    after_pm10_avg = Column(Float, nullable=False)

    improvement_percent = Column(Float, nullable=False)
    effectiveness_score = Column(Float, nullable=False)
    verdict = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)