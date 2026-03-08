from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TicketCreate(BaseModel):
    node_id: str
    location_name: str
    ward_id: str
    likely_source: str
    urgency: str
    target_team: str
    assigned_to: Optional[str] = None
    remarks: Optional[str] = None


class TicketUpdate(BaseModel):
    status: str
    assigned_to: Optional[str] = None
    remarks: Optional[str] = None


class TicketResponse(BaseModel):
    id: int
    node_id: str
    location_name: str
    ward_id: str
    likely_source: str
    urgency: str
    target_team: str
    status: str
    assigned_to: Optional[str]
    remarks: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True