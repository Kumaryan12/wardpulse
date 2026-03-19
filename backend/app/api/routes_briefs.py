from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.node import Node
from app.models.sensor_reading import SensorReading

router = APIRouter(prefix="/api/v1/briefs", tags=["AI Briefs"])


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


def get_recent_recurrence_count(db: Session, node_id: str, window: int = 12) -> int:
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.node_id == node_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(window)
        .all()
    )
    return sum(1 for r in readings if is_hotspot(r.pm25, r.pm10))


def compute_priority_shield(
    location_name: str,
    severity: str,
    hotspot: bool,
    likely_source: str,
    recurrence_count: int,
):
    score = 0

    severity_weights = {
        "good": 5,
        "moderate": 20,
        "poor": 40,
        "severe": 55,
    }
    score += severity_weights.get(severity, 0)

    sensitive, zone_type = detect_sensitive_zone(location_name)
    if hotspot:
        score += 15

    source_weights = {
        "burning": 20,
        "construction_dust": 15,
        "traffic_emissions": 12,
        "road_dust": 10,
        "mixed_uncertain": 6,
    }
    score += source_weights.get(likely_source, 0)

    if sensitive:
        score += 18

    if recurrence_count >= 6:
        score += 18
    elif recurrence_count >= 3:
        score += 10

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
        "escalation_required": escalation_required,
        "sensitive_zone": sensitive,
        "sensitive_zone_type": zone_type,
    }


def get_recommendation_bundle(source: str) -> dict:
    recommendation_map = {
        "construction_dust": {
            "urgency": "high",
            "target_team": "Construction Compliance Team",
            "recommended_actions": [
                "Inspect nearby construction site",
                "Verify debris covering compliance",
                "Deploy wet suppression measures",
                "Check boundary screening and material storage",
            ],
        },
        "road_dust": {
            "urgency": "medium",
            "target_team": "Road Sweeping and Maintenance Team",
            "recommended_actions": [
                "Deploy mechanized sweeping",
                "Initiate anti-dust water spraying",
                "Inspect roadside debris and potholes",
                "Clear resuspended dust accumulation zones",
            ],
        },
        "traffic_emissions": {
            "urgency": "medium",
            "target_team": "Traffic Management Team",
            "recommended_actions": [
                "Review traffic congestion patterns",
                "Trigger anti-idling enforcement",
                "Assess temporary diversion feasibility",
                "Increase monitoring in roadside corridor",
            ],
        },
        "burning": {
            "urgency": "critical",
            "target_team": "Field Enforcement Response Team",
            "recommended_actions": [
                "Dispatch urgent field response team",
                "Extinguish active burning source",
                "Remove waste or combustible material",
                "Flag location for repeat-offender monitoring",
            ],
        },
        "mixed_uncertain": {
            "urgency": "low",
            "target_team": "Ward Inspection Team",
            "recommended_actions": [
                "Deploy field inspection team",
                "Collect additional sensor readings",
                "Verify nearby dust, traffic, or burning sources",
                "Mark location for manual source review",
            ],
        },
    }

    return recommendation_map.get(
        source,
        {
            "urgency": "low",
            "target_team": "Ward Inspection Team",
            "recommended_actions": [
                "Deploy field inspection team",
                "Collect additional sensor readings",
                "Mark location for manual review",
            ],
        },
    )


def format_source(source: str) -> str:
    return source.replace("_", " ")


def generate_officer_brief(
    location_name: str,
    pm25: float,
    pm10: float,
    severity: str,
    likely_source: str,
    priority_level: str,
    priority_score: int,
    recurrence_count: int,
    sensitive_zone: bool,
    sensitive_zone_type: str | None,
    escalation_required: bool,
):
    zone_text = ""
    if sensitive_zone and sensitive_zone_type:
        zone_text = f" The site appears to be associated with a sensitive zone ({sensitive_zone_type})."

    escalation_text = ""
    if escalation_required:
        escalation_text = " Escalation is recommended due to combined priority, vulnerability, or recurrence indicators."

    recurrence_text = ""
    if recurrence_count >= 3:
        recurrence_text = f" This location shows recurring hotspot behavior with a recent recurrence count of {recurrence_count}."

    return (
        f"WardPulse has identified a {priority_level} priority pollution event at {location_name}. "
        f"Current readings indicate PM2.5 at {round(pm25, 2)} and PM10 at {round(pm10, 2)}, "
        f"classified under {severity} severity. The most likely contributing source is {format_source(likely_source)}. "
        f"The computed Priority Shield score is {priority_score}/100."
        f"{zone_text}{recurrence_text} "
        f"Immediate field action should focus on source verification, rapid mitigation, and status logging."
        f"{escalation_text}"
    )


def generate_citizen_advisory(
    location_name: str,
    severity: str,
    likely_source: str,
    sensitive_zone: bool,
):
    vulnerable_text = ""
    if sensitive_zone:
        vulnerable_text = " Extra caution is advised for children, elderly residents, and people with breathing difficulties."

    return (
        f"Air quality concern detected near {location_name}. "
        f"Current conditions are categorized as {severity}, with likely contribution from {format_source(likely_source)}. "
        f"Residents should reduce prolonged outdoor exposure in the immediate area, use masks if needed, and avoid strenuous activity outdoors."
        f"{vulnerable_text} "
        f"Authorities have been advised to initiate mitigation and monitoring actions."
    )


def generate_escalation_note(
    priority_level: str,
    escalation_required: bool,
    recurrence_count: int,
    sensitive_zone: bool,
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

    joined = ", ".join(reasons) if reasons else "elevated operational risk"

    return f"Escalation recommended due to {joined}. Consider higher-level enforcement review and rapid follow-up verification."


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
    likely_source = infer_source(node.location_name, latest.pm25, latest.pm10)
    recurrence_count = get_recent_recurrence_count(db, node.node_id)

    priority = compute_priority_shield(
        location_name=node.location_name,
        severity=severity,
        hotspot=hotspot,
        likely_source=likely_source,
        recurrence_count=recurrence_count,
    )

    recommendation_bundle = get_recommendation_bundle(likely_source)

    officer_brief = generate_officer_brief(
        location_name=node.location_name,
        pm25=latest.pm25,
        pm10=latest.pm10,
        severity=severity,
        likely_source=likely_source,
        priority_level=priority["priority_level"],
        priority_score=priority["priority_score"],
        recurrence_count=recurrence_count,
        sensitive_zone=priority["sensitive_zone"],
        sensitive_zone_type=priority["sensitive_zone_type"],
        escalation_required=priority["escalation_required"],
    )

    citizen_advisory = generate_citizen_advisory(
        location_name=node.location_name,
        severity=severity,
        likely_source=likely_source,
        sensitive_zone=priority["sensitive_zone"],
    )

    escalation_note = generate_escalation_note(
        priority_level=priority["priority_level"],
        escalation_required=priority["escalation_required"],
        recurrence_count=recurrence_count,
        sensitive_zone=priority["sensitive_zone"],
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