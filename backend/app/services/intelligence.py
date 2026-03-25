from sqlalchemy.orm import Session

from app.models.sensor_reading import SensorReading


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
    pm25: float,
    pm10: float,
    severity: str,
    hotspot: bool,
    likely_source: str,
    recurrence_count: int,
    noise_db: int,
) -> dict:
    score = 0
    reasons = []

    sensitive, zone_type = detect_sensitive_zone(location_name)

    noise_status = classify_noise(noise_db)
    if noise_status in ["high", "critical"]:
        reasons.append(f"{noise_status.capitalize()} noise exposure detected")
        if noise_status == "high":
            score += 6
        elif noise_status == "critical":
            score += 12

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
        "priority_reasons": reasons[:4],
        "escalation_required": escalation_required,
        "sensitive_zone": sensitive,
        "sensitive_zone_type": zone_type,
        "recurrence_count": recurrence_count,
    }