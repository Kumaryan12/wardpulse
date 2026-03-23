from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.node import Node
from app.models.sensor_reading import SensorReading
from app.schemas.reading_schema import ReadingCreate, ReadingResponse

router = APIRouter(prefix="/api/v1/readings", tags=["Readings"])


def classify_severity(pm25: float) -> str:
    if pm25 <= 60:
        return "good"
    elif pm25 <= 120:
        return "moderate"
    elif pm25 <= 250:
        return "poor"
    return "severe"


def classify_noise(noise_db: float) -> str:
    if noise_db < 55:
        return "acceptable"
    elif noise_db < 70:
        return "elevated"
    elif noise_db < 85:
        return "high"
    return "critical"


def is_hotspot(pm25: float, pm10: float) -> bool:
    return pm25 > 120 or pm10 > 250


def get_pm_ratio(pm25: float, pm10: float) -> float:
    if pm25 <= 0:
        return 0
    return pm10 / pm25


def normalize_scores(score_map: dict[str, float]) -> dict[str, float]:
    total = sum(score_map.values())
    if total <= 0:
        keys = list(score_map.keys())
        equal = round(1 / len(keys), 3) if keys else 0
        return {k: equal for k in keys}
    return {k: round(v / total, 3) for k, v in score_map.items()}


def infer_source_with_confidence(
    location_name: str,
    pm25: float,
    pm10: float,
    noise_db: float,
) -> dict:
    location = location_name.lower()
    ratio = get_pm_ratio(pm25, pm10)

    scores = {
        "construction_dust": 0.05,
        "road_dust": 0.05,
        "traffic_emissions": 0.05,
        "burning": 0.05,
        "mixed_uncertain": 0.10,
    }

    reasons = {
        "construction_dust": [],
        "road_dust": [],
        "traffic_emissions": [],
        "burning": [],
        "mixed_uncertain": [],
    }

    if noise_db >= 75 and (
        "road" in location
        or "junction" in location
        or "traffic" in location
        or "flyover" in location
    ):
        scores["traffic_emissions"] += 0.18
        reasons["traffic_emissions"].append(
            "Elevated noise supports heavy traffic activity"
        )

    if noise_db >= 80 and (
        "construction" in location or "site" in location or "edge" in location
    ):
        scores["construction_dust"] += 0.18
        reasons["construction_dust"].append(
            "High noise supports active construction machinery"
        )

    if noise_db < 65 and pm25 > 180 and ratio < 1.5:
        scores["burning"] += 0.10
        reasons["burning"].append(
            "Lower acoustic activity with fine particulate dominance supports burning hypothesis"
        )

    if ratio >= 1.8:
        scores["construction_dust"] += 0.30
        scores["road_dust"] += 0.22
        reasons["construction_dust"].append(
            "High PM10/PM2.5 ratio suggests coarse particulate dominance"
        )
        reasons["road_dust"].append(
            "Elevated PM10/PM2.5 ratio is consistent with coarse dust"
        )
    elif 1.2 <= ratio < 1.8:
        scores["traffic_emissions"] += 0.25
        reasons["traffic_emissions"].append(
            "Balanced PM2.5/PM10 profile suggests traffic-linked emissions"
        )
    elif ratio < 1.5 and pm25 > 180:
        scores["burning"] += 0.35
        reasons["burning"].append(
            "Fine particulate dominance with high PM2.5 suggests combustion/burning source"
        )

    if "construction" in location or "site" in location or "edge" in location:
        scores["construction_dust"] += 0.35
        reasons["construction_dust"].append(
            "Location context is linked to construction activity"
        )

    if "road" in location or "junction" in location or "roadside" in location:
        scores["road_dust"] += 0.20
        scores["traffic_emissions"] += 0.22
        reasons["road_dust"].append(
            "Road-linked location supports road dust hypothesis"
        )
        reasons["traffic_emissions"].append(
            "Road/junction context supports vehicle emission hypothesis"
        )

    if "traffic" in location:
        scores["traffic_emissions"] += 0.20
        reasons["traffic_emissions"].append(
            "Traffic-tagged location strengthens traffic emissions attribution"
        )

    if "residential" in location or "lane" in location:
        scores["mixed_uncertain"] += 0.12
        reasons["mixed_uncertain"].append(
            "Residential context increases uncertainty across multiple source types"
        )

    if pm10 > 250:
        scores["construction_dust"] += 0.18
        scores["road_dust"] += 0.14
        reasons["construction_dust"].append(
            "High PM10 supports a dust-dominant source"
        )
        reasons["road_dust"].append(
            "High PM10 can indicate significant road dust resuspension"
        )

    if pm25 > 120:
        scores["traffic_emissions"] += 0.10
        scores["burning"] += 0.12
        reasons["traffic_emissions"].append(
            "Elevated PM2.5 supports combustion/traffic contribution"
        )
        reasons["burning"].append(
            "High PM2.5 is consistent with combustion-related sources"
        )

    if pm25 <= 90 and pm10 <= 180:
        scores["mixed_uncertain"] += 0.10
        reasons["mixed_uncertain"].append(
            "Moderate readings reduce certainty of a dominant single source"
        )

    normalized = normalize_scores(scores)
    likely_source = max(normalized, key=normalized.get)
    confidence_score = round(normalized[likely_source], 3)

    attribution_reasons = reasons[likely_source]
    if not attribution_reasons:
        attribution_reasons = [
            "Insufficient strong evidence; assigned based on best available pattern match"
        ]

    return {
        "likely_source": likely_source,
        "confidence_score": confidence_score,
        "source_scores": normalized,
        "attribution_reasons": attribution_reasons[:3],
        "pm_ratio": round(ratio, 2),
    }


def get_recommendation_bundle(
    source: str,
    noise_db: float = 0,
    sensitive_zone: bool = False,
) -> dict:
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

    bundle = recommendation_map.get(
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
    ).copy()

    bundle["recommended_actions"] = list(bundle["recommended_actions"])

    if source == "traffic_emissions" and noise_db >= 75:
        bundle["recommended_actions"].append(
            "Initiate anti-honking and anti-idling enforcement"
        )
        bundle["recommended_actions"].append(
            "Assess temporary traffic diversion feasibility"
        )

    if source == "construction_dust" and noise_db >= 80:
        bundle["recommended_actions"].append(
            "Inspect machinery-hour compliance"
        )
        bundle["recommended_actions"].append(
            "Verify acoustic barrier and equipment shielding measures"
        )

    if sensitive_zone and noise_db >= 75:
        bundle["recommended_actions"].append(
            "Prioritize exposure reduction around sensitive zone"
        )

    return bundle


def get_recent_recurrence_count(db: Session, node_id: str, window: int = 12) -> int:
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.node_id == node_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(window)
        .all()
    )
    return sum(1 for r in readings if is_hotspot(r.pm25, r.pm10))


def detect_sensitive_zone(location_name: str) -> tuple[bool, str | None]:
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


def compute_priority_shield(
    location_name: str,
    pm25: float,
    pm10: float,
    severity: str,
    hotspot: bool,
    likely_source: str,
    recurrence_count: int,
    noise_db: float,
) -> dict:
    score = 0
    reasons = []

    sensitive, zone_type = detect_sensitive_zone(location_name)

    noise_status = classify_noise(noise_db)
    if noise_status in ["high", "critical"]:
        reasons.append(f"{noise_status.capitalize()} noise exposure detected")

    if sensitive and noise_db >= 75:
        score += 8
        reasons.append("Sensitive zone affected by elevated noise")

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
    if likely_source in source_weights:
        reasons.append(
            f"High-risk source type: {likely_source.replace('_', ' ')}"
        )

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

    escalation_required = score >= 80 or (
        sensitive and hotspot and recurrence_count >= 3
    )

    return {
        "priority_score": score,
        "priority_level": priority_level,
        "priority_reasons": reasons[:5],
        "escalation_required": escalation_required,
        "sensitive_zone": sensitive,
        "sensitive_zone_type": zone_type,
        "recurrence_count": recurrence_count,
        "noise_status": noise_status,
    }


@router.post("/", response_model=ReadingResponse)
def create_reading(reading: ReadingCreate, db: Session = Depends(get_db)):
    node = db.query(Node).filter(Node.node_id == reading.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not registered")

    db_reading = SensorReading(**reading.model_dump())
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading


@router.get("/latest")
def get_latest_readings(db: Session = Depends(get_db)):
    nodes = db.query(Node).all()
    result = []

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

            attribution = infer_source_with_confidence(
                node.location_name,
                latest.pm25,
                latest.pm10,
                latest.noise_db,
            )

            sensitive, _ = detect_sensitive_zone(node.location_name)

            recommendation_bundle = get_recommendation_bundle(
                attribution["likely_source"],
                noise_db=latest.noise_db,
                sensitive_zone=sensitive,
            )

            recurrence_count = get_recent_recurrence_count(db, node.node_id)
            priority_shield = compute_priority_shield(
                location_name=node.location_name,
                pm25=latest.pm25,
                pm10=latest.pm10,
                severity=severity,
                hotspot=hotspot,
                likely_source=attribution["likely_source"],
                recurrence_count=recurrence_count,
                noise_db=latest.noise_db,
            )

            result.append(
                {
                    "node_id": node.node_id,
                    "location_name": node.location_name,
                    "ward_id": node.ward_id,
                    "latitude": node.latitude,
                    "longitude": node.longitude,
                    "pm25": latest.pm25,
                    "pm10": latest.pm10,
                    "temperature": latest.temperature,
                    "humidity": latest.humidity,
                    "noise_db": latest.noise_db,
                    "timestamp": latest.timestamp,
                    "severity": severity,
                    "is_hotspot": hotspot,
                    "pm_ratio": attribution["pm_ratio"],
                    "likely_source": attribution["likely_source"],
                    "confidence_score": attribution["confidence_score"],
                    "source_scores": attribution["source_scores"],
                    "attribution_reasons": attribution["attribution_reasons"],
                    "urgency": recommendation_bundle["urgency"],
                    "target_team": recommendation_bundle["target_team"],
                    "recommended_actions": recommendation_bundle["recommended_actions"],
                    "priority_score": priority_shield["priority_score"],
                    "priority_level": priority_shield["priority_level"],
                    "priority_reasons": priority_shield["priority_reasons"],
                    "escalation_required": priority_shield["escalation_required"],
                    "sensitive_zone": priority_shield["sensitive_zone"],
                    "sensitive_zone_type": priority_shield["sensitive_zone_type"],
                    "recurrence_count": priority_shield["recurrence_count"],
                    "noise_status": priority_shield["noise_status"],
                }
            )

    return result


@router.get("/history/{node_id}")
def get_node_history(node_id: str, limit: int = 20, db: Session = Depends(get_db)):
    node = db.query(Node).filter(Node.node_id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.node_id == node_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )

    readings = list(reversed(readings))

    return [
        {
            "timestamp": reading.timestamp,
            "pm25": reading.pm25,
            "pm10": reading.pm10,
            "temperature": reading.temperature,
            "humidity": reading.humidity,
            "noise_db": reading.noise_db,
        }
        for reading in readings
    ]