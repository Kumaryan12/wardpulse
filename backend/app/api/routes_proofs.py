import os
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR
from app.database import get_db
from app.models.ticket import Ticket
from app.models.proof_log import ProofLog
from app.schemas.proof_schema import ProofLogResponse

router = APIRouter(prefix="/api/v1/proofs", tags=["Proof Logs"])

os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_upload(file: UploadFile | None) -> str | None:
    if not file:
        return None

    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    return f"/uploads/{unique_name}"


@router.post("/{ticket_id}", response_model=ProofLogResponse)
def upload_proof_log(
    ticket_id: int,
    remarks: str = Form(""),
    before_image: UploadFile | None = File(None),
    after_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    before_path = save_upload(before_image)
    after_path = save_upload(after_image)

    proof = ProofLog(
        ticket_id=ticket_id,
        before_image_path=before_path,
        after_image_path=after_path,
        remarks=remarks,
        uploaded_at=datetime.utcnow(),
    )

    ticket.status = "resolved"
    ticket.updated_at = datetime.utcnow()

    db.add(proof)
    db.commit()
    db.refresh(proof)

    return proof


@router.get("/{ticket_id}", response_model=list[ProofLogResponse])
def get_proof_logs(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return (
        db.query(ProofLog)
        .filter(ProofLog.ticket_id == ticket_id)
        .order_by(ProofLog.uploaded_at.desc())
        .all()
    )