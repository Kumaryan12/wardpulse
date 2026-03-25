import os
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from twilio.rest import Client

router = APIRouter(prefix="/api/v1/advisories", tags=["Advisories"])


class WhatsAppAdvisoryRequest(BaseModel):
    node_id: str
    location_name: str
    ward_id: str | None = None
    likely_source: str | None = None
    message: str


@router.post("/whatsapp")
def send_whatsapp_advisory(payload: WhatsAppAdvisoryRequest):
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_whatsapp = os.getenv("TWILIO_WHATSAPP_FROM")
    to_whatsapp = os.getenv("WHATSAPP_TO_NUMBER")

    if not account_sid or not auth_token or not from_whatsapp or not to_whatsapp:
        raise HTTPException(
            status_code=500,
            detail="Twilio WhatsApp environment variables are missing",
        )

    try:
        client = Client(account_sid, auth_token)

        msg = client.messages.create(
            body=payload.message,
            from_=from_whatsapp,
            to=f"whatsapp:{to_whatsapp}",
        )

        return {
            "status": "sent",
            "sid": msg.sid,
            "node_id": payload.node_id,
            "location_name": payload.location_name,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send WhatsApp advisory: {str(e)}",
        )