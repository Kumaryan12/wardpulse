import os
import smtplib
from email.message import EmailMessage

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


class DispatchEmailRequest(BaseModel):
    node_id: str
    location_name: str
    ward_id: str | None = None
    severity: str | None = None
    likely_source: str | None = None
    urgency: str | None = None
    target_team: str | None = None
    officer_brief: str
    to_email: str | None = None


@router.post("/dispatch-email")
def send_dispatch_email(payload: DispatchEmailRequest):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL", smtp_username)
    default_to_email = os.getenv("DISPATCH_OFFICER_EMAIL")
    to_email = payload.to_email or default_to_email

    print("=== DISPATCH EMAIL DEBUG ===")
    print("SMTP_HOST:", smtp_host)
    print("SMTP_PORT:", smtp_port)
    print("SMTP_USERNAME:", smtp_username)
    print("SMTP_PASSWORD exists:", bool(smtp_password))
    print("SMTP_FROM_EMAIL:", smtp_from_email)
    print("DISPATCH_OFFICER_EMAIL:", default_to_email)
    print("Resolved to_email:", to_email)

    if not smtp_host or not smtp_username or not smtp_password or not smtp_from_email:
        raise HTTPException(status_code=500, detail="SMTP environment variables are missing")

    if not to_email:
        raise HTTPException(status_code=500, detail="No dispatch officer email configured")

    subject = f"WardPulse Dispatch Alert — {payload.location_name}"
    body = "\n".join([
        "WardPulse Officer Dispatch",
        "",
        f"Node ID: {payload.node_id}",
        f"Location: {payload.location_name}",
        f"Ward: {payload.ward_id or 'N/A'}",
        f"Severity: {payload.severity or 'N/A'}",
        f"Likely Source: {(payload.likely_source or 'N/A').replace('_', ' ')}",
        f"Urgency: {payload.urgency or 'N/A'}",
        f"Target Team: {payload.target_team or 'N/A'}",
        "",
        "Officer Brief:",
        payload.officer_brief,
        "",
        "Action Required:",
        "Please verify the site and initiate field response.",
        "",
        "— WardPulse Command Center",
    ])

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = smtp_from_email
        msg["To"] = to_email
        msg.set_content(body)

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.set_debuglevel(1)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)

        return {"status": "sent", "to_email": to_email}

    except Exception as e:
        print("DISPATCH EMAIL ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=f"Failed to send dispatch email: {str(e)}")