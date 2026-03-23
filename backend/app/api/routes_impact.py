from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ticket import Ticket
from app.models.proof_log import ProofLog
from app.models.sensor_reading import SensorReading
from app.models.impact_report import ImpactReport
from app.schemas.impact_schema import ImpactReportResponse

router = APIRouter(prefix="/api/v1/impact", tags=["Impact Evaluation"])


def avg(values):
    return sum(values) / len(values) if values else 0.0


def get_verdict(improvement_percent: float) -> str:
    if improvement_percent >= 25:
        return "effective"
    elif improvement_percent >= 10:
        return "moderate_improvement"
    return "limited_impact"


def get_effectiveness_score(improvement_percent: float) -> float:
    if improvement_percent < 0:
        return 0.0
    return min(round(improvement_percent, 2), 100.0)


def get_improvement_percent(before_avg: float, after_avg: float) -> float:
    if before_avg <= 0:
        return 0.0
    return round(((before_avg - after_avg) / before_avg) * 100, 2)


@router.post("/{ticket_id}", response_model=ImpactReportResponse)
def generate_impact_report(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    latest_proof = (
        db.query(ProofLog)
        .filter(ProofLog.ticket_id == ticket_id)
        .order_by(ProofLog.uploaded_at.desc())
        .first()
    )
    if not latest_proof:
        raise HTTPException(status_code=404, detail="No proof log found for this ticket")

    proof_time = latest_proof.uploaded_at

    before_readings = (
        db.query(SensorReading)
        .filter(
            SensorReading.node_id == ticket.node_id,
            SensorReading.timestamp < proof_time,
        )
        .order_by(SensorReading.timestamp.desc())
        .limit(5)
        .all()
    )

    after_readings = (
        db.query(SensorReading)
        .filter(
            SensorReading.node_id == ticket.node_id,
            SensorReading.timestamp >= proof_time,
        )
        .order_by(SensorReading.timestamp.asc())
        .limit(5)
        .all()
    )

    if not before_readings or not after_readings:
        raise HTTPException(
            status_code=400,
            detail="Not enough readings before or after proof upload to evaluate impact",
        )

    before_pm25_avg = round(avg([r.pm25 for r in before_readings]), 2)
    after_pm25_avg = round(avg([r.pm25 for r in after_readings]), 2)

    before_pm10_avg = round(avg([r.pm10 for r in before_readings]), 2)
    after_pm10_avg = round(avg([r.pm10 for r in after_readings]), 2)

    before_noise_avg = round(avg([r.noise_db for r in before_readings]), 2)
    after_noise_avg = round(avg([r.noise_db for r in after_readings]), 2)

    pm25_improvement_percent = get_improvement_percent(before_pm25_avg, after_pm25_avg)
    pm10_improvement_percent = get_improvement_percent(before_pm10_avg, after_pm10_avg)
    noise_improvement_percent = get_improvement_percent(before_noise_avg, after_noise_avg)

    improvement_percent = round(
        (pm25_improvement_percent * 0.45)
        + (pm10_improvement_percent * 0.35)
        + (noise_improvement_percent * 0.20),
        2,
    )

    effectiveness_score = get_effectiveness_score(improvement_percent)
    verdict = get_verdict(improvement_percent)

    existing = db.query(ImpactReport).filter(ImpactReport.ticket_id == ticket_id).first()
    if existing:
        existing.before_pm25_avg = before_pm25_avg
        existing.after_pm25_avg = after_pm25_avg
        existing.before_pm10_avg = before_pm10_avg
        existing.after_pm10_avg = after_pm10_avg
        existing.before_noise_avg = before_noise_avg
        existing.after_noise_avg = after_noise_avg
        existing.pm25_improvement_percent = pm25_improvement_percent
        existing.pm10_improvement_percent = pm10_improvement_percent
        existing.noise_improvement_percent = noise_improvement_percent
        existing.improvement_percent = improvement_percent
        existing.effectiveness_score = effectiveness_score
        existing.verdict = verdict
        existing.created_at = datetime.utcnow()

        db.commit()
        db.refresh(existing)
        return existing

    report = ImpactReport(
        ticket_id=ticket_id,
        before_pm25_avg=before_pm25_avg,
        after_pm25_avg=after_pm25_avg,
        before_pm10_avg=before_pm10_avg,
        after_pm10_avg=after_pm10_avg,
        before_noise_avg=before_noise_avg,
        after_noise_avg=after_noise_avg,
        pm25_improvement_percent=pm25_improvement_percent,
        pm10_improvement_percent=pm10_improvement_percent,
        noise_improvement_percent=noise_improvement_percent,
        improvement_percent=improvement_percent,
        effectiveness_score=effectiveness_score,
        verdict=verdict,
        created_at=datetime.utcnow(),
    )

    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/{ticket_id}", response_model=ImpactReportResponse)
def get_impact_report(ticket_id: int, db: Session = Depends(get_db)):
    report = db.query(ImpactReport).filter(ImpactReport.ticket_id == ticket_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Impact report not found")
    return report