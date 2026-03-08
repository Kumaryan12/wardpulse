from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.node import Node
from app.models.sensor_reading import SensorReading

router = APIRouter(prefix="/api/v1/memory", tags=["Recurring Hotspot Memory"])


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


def compute_priority_level(location_name: str, severity: str, hotspot: bool, source: str, recurrence_count: int):
    score = 0

    severity_weights = {"good": 5, "moderate": 20, "poor": 40, "severe": 55}
    source_weights = {
        "burning": 20,
        "construction_dust": 15,
        "traffic_emissions": 12,
        "road_dust": 10,
        "mixed_uncertain": 6,
    }

    score += severity_weights.get(severity, 0)
    score += source_weights.get(source, 0)

    if hotspot:
        score += 15

    sensitive, _ = detect_sensitive_zone(location_name)
    if sensitive:
        score += 18

    if recurrence_count >= 6:
        score += 18
    elif recurrence_count >= 3:
        score += 10

    score = min(score, 100)

    if score >= 80:
        level = "critical"
    elif score >= 60:
        level = "high"
    elif score >= 35:
        level = "medium"
    else:
        level = "low"

    escalation_required = score >= 80 or (sensitive and hotspot and recurrence_count >= 3)

    return score, level, escalation_required, sensitive


def chronic_recommendation(recurrence_count: int, escalation_required: bool, source: str):
    if escalation_required and recurrence_count >= 6:
        return "Escalate to enforcement and initiate structural mitigation review"
    if recurrence_count >= 4 and source == "construction_dust":
        return "Initiate repeat construction compliance action and recurring site audit"
    if recurrence_count >= 4 and source == "road_dust":
        return "Consider corridor-level dust management instead of isolated cleaning"
    if recurrence_count >= 4 and source == "traffic_emissions":
        return "Review recurring traffic choke point and enforce anti-idling measures"
    if recurrence_count >= 4 and source == "burning":
        return "Flag chronic burning zone for repeated enforcement and surveillance"
    return "Continue monitoring and maintain targeted intervention"


@router.get("/chronic-risk")
def get_chronic_risk_panel(window: int = 20, db: Session = Depends(get_db)):
    nodes = db.query(Node).all()
    chronic_nodes = []

    for node in nodes:
        readings = (
            db.query(SensorReading)
            .filter(SensorReading.node_id == node.node_id)
            .order_by(SensorReading.timestamp.desc())
            .limit(window)
            .all()
        )

        if not readings:
            continue

        hotspot_readings = [r for r in readings if is_hotspot(r.pm25, r.pm10)]
        recurrence_count = len(hotspot_readings)

        if recurrence_count == 0:
            continue

        source_counter = Counter(
            infer_source(node.location_name, r.pm25, r.pm10) for r in hotspot_readings
        )
        dominant_source = source_counter.most_common(1)[0][0]

        latest = readings[0]
        severity = classify_severity(latest.pm25)
        hotspot = is_hotspot(latest.pm25, latest.pm10)

        priority_score, priority_level, escalation_required, sensitive_zone = compute_priority_level(
            node.location_name,
            severity,
            hotspot,
            dominant_source,
            recurrence_count,
        )

        recommendation = chronic_recommendation(
            recurrence_count,
            escalation_required,
            dominant_source,
        )

        chronic_nodes.append(
            {
                "node_id": node.node_id,
                "location_name": node.location_name,
                "ward_id": node.ward_id,
                "current_pm25": latest.pm25,
                "current_pm10": latest.pm10,
                "severity": severity,
                "recurrence_count": recurrence_count,
                "dominant_source": dominant_source,
                "priority_score": priority_score,
                "priority_level": priority_level,
                "escalation_required": escalation_required,
                "sensitive_zone": sensitive_zone,
                "chronic_recommendation": recommendation,
            }
        )

    chronic_nodes.sort(
        key=lambda x: (x["recurrence_count"], x["priority_score"]),
        reverse=True,
    )

    return {
        "total_chronic_nodes": len(chronic_nodes),
        "critical_chronic_nodes": len([n for n in chronic_nodes if n["priority_level"] == "critical"]),
        "chronic_nodes": chronic_nodes[:5],
    }