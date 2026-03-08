from pydantic import BaseModel
from typing import Optional


class NodeCreate(BaseModel):
    node_id: str
    ward_id: str
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    node_type: str


class NodeResponse(NodeCreate):
    status: str

    class Config:
        from_attributes = True