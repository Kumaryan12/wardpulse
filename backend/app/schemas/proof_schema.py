from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProofLogResponse(BaseModel):
    id: int
    ticket_id: int
    before_image_path: Optional[str]
    after_image_path: Optional[str]
    remarks: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True