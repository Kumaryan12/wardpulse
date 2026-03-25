from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.node import Node
from app.models.sensor_reading import SensorReading

from app.api.routes_readings import (
    classify_severity,
    is_hotspot,
    infer_source_with_confidence,
    get_recommendation_bundle,
    get_recent_recurrence_count,
    compute_priority_shield,
)

router = APIRouter(prefix="/api/v1/briefs", tags=["AI Briefs"])


def format_source(source: str) -> str:
    return source.replace("_", " ")


def generate_officer_brief(
    location_name: str,
    pm25: float,
    pm10: float,
    noise_db: float,
    severity: str,
    likely_source: str,
    confidence_score: float,
    priority_level: str,
    priority_score: int,
    recurrence_count: int,
    sensitive_zone: bool,
    sensitive_zone_type: str | None,
    escalation_required: bool,
    target_team: str,
):
    zone_text = ""
    if sensitive_zone and sensitive_zone_type:
        zone_text = (
            f" The site appears to be associated with a sensitive zone "
            f"({sensitive_zone_type})."
        )

    recurrence_text = ""
    if recurrence_count >= 3:
        recurrence_text = (
            f" This location shows recurring hotspot behavior with a recent "
            f"recurrence count of {recurrence_count}."
        )

    escalation_text = ""
    if escalation_required:
        escalation_text = (
            " Escalation is recommended due to combined priority, vulnerability, "
            "or recurrence indicators."
        )

    return (
        f"WardPulse has identified a {priority_level} priority environmental event at "
        f"{location_name}. Current readings indicate PM2.5 at {round(pm25, 2)}, "
        f"PM10 at {round(pm10, 2)}, and noise at {round(noise_db, 2)} dB, classified "
        f"under {severity} severity. The most likely contributing source is "
        f"{format_source(likely_source)} with approximately "
        f"{round(confidence_score * 100)}% confidence. The computed Priority Shield "
        f"score is {priority_score}/100. Recommended operational owner: {target_team}."
        f"{zone_text}{recurrence_text} Immediate field action should focus on source "
        f"verification, rapid mitigation, and status logging.{escalation_text}"
    )


def generate_citizen_advisory(
    location_name: str,
    severity: str,
    likely_source: str,
    noise_db: float,
    sensitive_zone: bool,
):
    vulnerable_text = ""
    if sensitive_zone:
        vulnerable_text = (
            " Extra caution is advised for children, elderly residents, and people "
            "with breathing difficulties."
        )

    noise_text = ""
    if noise_db >= 85:
        noise_text = (
            " Noise levels are also critically elevated, so residents should avoid "
            "prolonged exposure in the immediate area."
        )
    elif noise_db >= 70:
        noise_text = (
            " Noise levels are elevated in this area, so minimizing exposure is advised."
        )

    return (
        f"Air quality concern detected near {location_name}. Current conditions are "
        f"categorized as {severity}, with likely contribution from "
        f"{format_source(likely_source)}. Residents should reduce prolonged outdoor "
        f"exposure in the immediate area, use masks if needed, and avoid strenuous "
        f"activity outdoors.{vulnerable_text}{noise_text} Authorities have been advised "
        f"to initiate mitigation and monitoring actions."
    )


def generate_escalation_note(
    priority_level: str,
    escalation_required: bool,
    recurrence_count: int,
    sensitive_zone: bool,
    likely_source: str,
):
    if not escalation_required:
        return "Escalation not currently required. Continue monitoring and field verification."

    reasons = []
    if priority_level == "critical":
        reasons.append("critical priority level")
    if recurrence_count >= 3:
        reasons.append("repeat hotspot recurrence")
    if sensitive_zone:
        reasons.append("sensitive-zone exposure risk")
    if likely_source in {"burning", "construction_dust"}:
        reasons.append(f"high-risk source profile ({format_source(likely_source)})")

    joined = ", ".join(reasons) if reasons else "elevated operational risk"

    return (
        f"Escalation recommended due to {joined}. Consider higher-level enforcement "
        f"review and rapid follow-up verification."
    )


@router.get("/{node_id}")
def generate_brief_bundle(node_id: str, db: Session = Depends(get_db)):
    node = db.query(Node).filter(Node.node_id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    latest = (
        db.query(SensorReading)
        .filter(SensorReading.node_id == node_id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    if not latest:
        raise HTTPException(status_code=404, detail="No readings found for node")

    severity = classify_severity(latest.pm25)
    hotspot = is_hotspot(latest.pm25, latest.pm10)

    attribution = infer_source_with_confidence(
        node.location_name,
        latest.pm25,
        latest.pm10,
        latest.noise_db if latest.noise_db is not None else 0.0,
    )

    likely_source = attribution["likely_source"]
    confidence_score = attribution["confidence_score"]

    recurrence_count = get_recent_recurrence_count(db, node.node_id)

    priority = compute_priority_shield(
        location_name=node.location_name,
        pm25=latest.pm25,
        pm10=latest.pm10,
        severity=severity,
        hotspot=hotspot,
        likely_source=likely_source,
        recurrence_count=recurrence_count,
        noise_db=int(latest.noise_db if latest.noise_db is not None else 0),
    )

    recommendation_bundle = get_recommendation_bundle(likely_source)

    officer_brief = generate_officer_brief(
        location_name=node.location_name,
        pm25=latest.pm25,
        pm10=latest.pm10,
        noise_db=latest.noise_db if latest.noise_db is not None else 0.0,
        severity=severity,
        likely_source=likely_source,
        confidence_score=confidence_score,
        priority_level=priority["priority_level"],
        priority_score=priority["priority_score"],
        recurrence_count=recurrence_count,
        sensitive_zone=priority["sensitive_zone"],
        sensitive_zone_type=priority["sensitive_zone_type"],
        escalation_required=priority["escalation_required"],
        target_team=recommendation_bundle["target_team"],
    )

    citizen_advisory = generate_citizen_advisory(
        location_name=node.location_name,
        severity=severity,
        likely_source=likely_source,
        noise_db=latest.noise_db if latest.noise_db is not None else 0.0,
        sensitive_zone=priority["sensitive_zone"],
    )

    escalation_note = generate_escalation_note(
        priority_level=priority["priority_level"],
        escalation_required=priority["escalation_required"],
        recurrence_count=recurrence_count,
        sensitive_zone=priority["sensitive_zone"],
        likely_source=likely_source,
    )

    return {
        "node_id": node.node_id,
        "location_name": node.location_name,
        "ward_id": node.ward_id,
        "likely_source": likely_source,
        "urgency": recommendation_bundle["urgency"],
        "target_team": recommendation_bundle["target_team"],
        "officer_brief": officer_brief,
        "citizen_advisory": citizen_advisory,
        "escalation_note": escalation_note,
    }