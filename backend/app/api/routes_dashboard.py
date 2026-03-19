from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.node import Node
from app.models.sensor_reading import SensorReading
from app.models.ticket import Ticket

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


def classify_severity(pm25: float) -> str:
    if pm25 <= 60:
        return "good"
    elif pm25 <= 120:
        return "moderate"
    elif pm25 <= 250:
        return "poor"
    return "severe"


def is_hotspot(pm25: float, pm10: float) -> bool:
    return pm25 > 120 or pm10 > 250


def get_pm_ratio(pm25: float, pm10: float) -> float:
    if pm25 <= 0:
        return 0
    return pm10 / pm25


def detect_sensitive_zone(location_name: str):
    location = location_name.lower()

    sensitive_keywords = {
        "school": "school",
        "hospital": "hospital",
        "clinic": "hospital",
        "residential": "residential zone",
        "lane": "residential zone",
        "market": "market",
        "bus": "bus stop / transit zone",
        "anganwadi": "anganwadi",
    }

    for keyword, zone_type in sensitive_keywords.items():
        if keyword in location:
            return True, zone_type

    return False, None


def get_recent_recurrence_count(db: Session, node_id: str, window: int = 12) -> int:
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.node_id == node_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(window)
        .all()
    )
    return sum(1 for r in readings if is_hotspot(r.pm25, r.pm10))


def infer_source(location_name: str, pm25: float, pm10: float) -> str:
    location = location_name.lower()
    ratio = get_pm_ratio(pm25, pm10)

    if (
        ("construction" in location or "site" in location or "edge" in location)
        and pm10 > 250
        and ratio >= 1.8
    ):
        return "construction_dust"
    elif (
        ("road" in location or "junction" in location or "roadside" in location)
        and pm10 > 200
        and ratio >= 1.7
    ):
        return "road_dust"
    elif (
        ("road" in location or "junction" in location or "traffic" in location)
        and pm25 > 100
        and 1.2 <= ratio < 1.7
    ):
        return "traffic_emissions"
    elif pm25 > 180 and ratio < 1.5:
        return "burning"
    else:
        return "mixed_uncertain"


def compute_priority_shield(
    location_name: str,
    severity: str,
    hotspot: bool,
    likely_source: str,
    recurrence_count: int,
):
    score = 0
    reasons = []

    severity_weights = {
        "good": 5,
        "moderate": 20,
        "poor": 40,
        "severe": 55,
    }
    score += severity_weights.get(severity, 0)
    if severity in ["poor", "severe"]:
        reasons.append(f"{severity.capitalize()} PM2.5 concentration")

    if hotspot:
        score += 15
        reasons.append("Active hotspot threshold exceeded")

    sensitive, zone_type = detect_sensitive_zone(location_name)
    if sensitive:
        score += 18
        reasons.append(f"Located near sensitive zone: {zone_type}")

    source_weights = {
        "burning": 20,
        "construction_dust": 15,
        "traffic_emissions": 12,
        "road_dust": 10,
        "mixed_uncertain": 6,
    }
    score += source_weights.get(likely_source, 0)
    reasons.append(f"High-risk source type: {likely_source.replace('_', ' ')}")

    if recurrence_count >= 6:
        score += 18
        reasons.append("Recurring hotspot pattern detected")
    elif recurrence_count >= 3:
        score += 10
        reasons.append("Repeated hotspot activity observed recently")

    score = min(score, 100)

    if score >= 80:
        priority_level = "critical"
    elif score >= 60:
        priority_level = "high"
    elif score >= 35:
        priority_level = "medium"
    else:
        priority_level = "low"

    escalation_required = score >= 80 or (sensitive and hotspot and recurrence_count >= 3)

    return {
        "priority_score": score,
        "priority_level": priority_level,
        "priority_reasons": reasons[:4],
        "escalation_required": escalation_required,
        "sensitive_zone": sensitive,
        "sensitive_zone_type": zone_type,
        "recurrence_count": recurrence_count,
    }


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    total_nodes = db.query(Node).count()
    total_readings = db.query(SensorReading).count()

    avg_pm25 = db.query(func.avg(SensorReading.pm25)).scalar() or 0
    avg_pm10 = db.query(func.avg(SensorReading.pm10)).scalar() or 0

    return {
        "total_nodes": total_nodes,
        "total_readings": total_readings,
        "average_pm25": round(avg_pm25, 2),
        "average_pm10": round(avg_pm10, 2),
    }


@router.get("/situation-room")
def situation_room(db: Session = Depends(get_db)):
    nodes = db.query(Node).all()

    latest_node_states = []
    source_counter = Counter()

    for node in nodes:
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.node_id == node.node_id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )

        if latest:
            severity = classify_severity(latest.pm25)
            hotspot = is_hotspot(latest.pm25, latest.pm10)
            likely_source = infer_source(node.location_name, latest.pm25, latest.pm10)
            recurrence_count = get_recent_recurrence_count(db, node.node_id)
            priority = compute_priority_shield(
                location_name=node.location_name,
                severity=severity,
                hotspot=hotspot,
                likely_source=likely_source,
                recurrence_count=recurrence_count,
            )

            source_counter[likely_source] += 1

            latest_node_states.append(
                {
                    "node_id": node.node_id,
                    "location_name": node.location_name,
                    "pm25": latest.pm25,
                    "pm10": latest.pm10,
                    "severity": severity,
                    "is_hotspot": hotspot,
                    "likely_source": likely_source,
                    "priority_score": priority["priority_score"],
                    "priority_level": priority["priority_level"],
                    "escalation_required": priority["escalation_required"],
                    "sensitive_zone": priority["sensitive_zone"],
                    "sensitive_zone_type": priority["sensitive_zone_type"],
                    "recurrence_count": priority["recurrence_count"],
                }
            )

    severe_nodes = [n for n in latest_node_states if n["severity"] == "severe"]
    hotspot_nodes = [n for n in latest_node_states if n["is_hotspot"]]
    escalation_nodes = [n for n in latest_node_states if n["escalation_required"]]
    sensitive_zone_nodes = [n for n in latest_node_states if n["sensitive_zone"]]

    highest_risk_node = None
    if latest_node_states:
        highest_risk_node = max(latest_node_states, key=lambda x: x["pm25"])

    top_priority_node = None
    if latest_node_states:
        top_priority_node = max(latest_node_states, key=lambda x: x["priority_score"])

    total_tickets = db.query(Ticket).count()
    open_tickets = db.query(Ticket).filter(Ticket.status.in_(["open", "assigned", "in_progress"])).count()
    resolved_tickets = db.query(Ticket).filter(Ticket.status.in_(["resolved", "closed"])).count()

    top_source = source_counter.most_common(1)[0][0] if source_counter else "none"

    return {
        "active_hotspots": len(hotspot_nodes),
        "severe_nodes": len(severe_nodes),
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets,
        "top_source": top_source,
        "highest_risk_node": highest_risk_node,
        "top_priority_node": top_priority_node,
        "escalation_required_count": len(escalation_nodes),
        "sensitive_zone_count": len(sensitive_zone_nodes),
    }