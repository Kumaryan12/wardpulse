from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ReadingCreate(BaseModel):
    node_id: str
    timestamp: datetime
    pm25: float
    pm10: float
    temperature: float
    humidity: float
    battery: Optional[float] = None


class ReadingResponse(ReadingCreate):
    id: int

    class Config:
        from_attributes = True