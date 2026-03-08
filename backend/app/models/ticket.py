from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, nullable=False)
    location_name = Column(String, nullable=False)
    ward_id = Column(String, nullable=False)

    likely_source = Column(String, nullable=False)
    urgency = Column(String, nullable=False)
    target_team = Column(String, nullable=False)

    status = Column(String, default="open", nullable=False)
    assigned_to = Column(String, nullable=True)
    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)