from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ticket import Ticket
from app.schemas.ticket_schema import TicketCreate, TicketUpdate, TicketResponse

router = APIRouter(prefix="/api/v1/tickets", tags=["Tickets"])


@router.post("/", response_model=TicketResponse)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    db_ticket = Ticket(
        node_id=ticket.node_id,
        location_name=ticket.location_name,
        ward_id=ticket.ward_id,
        likely_source=ticket.likely_source,
        urgency=ticket.urgency,
        target_team=ticket.target_team,
        assigned_to=ticket.assigned_to,
        remarks=ticket.remarks,
        status="open",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.get("/", response_model=list[TicketResponse])
def get_tickets(db: Session = Depends(get_db)):
    return db.query(Ticket).order_by(Ticket.created_at.desc()).all()


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: int, payload: TicketUpdate, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.status = payload.status
    ticket.assigned_to = payload.assigned_to
    ticket.remarks = payload.remarks
    ticket.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(ticket)
    return ticket