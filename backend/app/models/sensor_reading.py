from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, ForeignKey("nodes.node_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    pm25 = Column(Float, nullable=False)
    pm10 = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    battery = Column(Float, nullable=True)