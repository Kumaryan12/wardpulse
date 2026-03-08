from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime
from app.database import Base


class ProofLog(Base):
    __tablename__ = "proof_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)

    before_image_path = Column(String, nullable=True)
    after_image_path = Column(String, nullable=True)
    remarks = Column(Text, nullable=True)

    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)