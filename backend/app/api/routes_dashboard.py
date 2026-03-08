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

            # lightweight source inference from location + ratio
            ratio = (latest.pm10 / latest.pm25) if latest.pm25 > 0 else 0
            location = node.location_name.lower()

            if (
                ("construction" in location or "site" in location or "edge" in location)
                and latest.pm10 > 250
                and ratio >= 1.8
            ):
                likely_source = "construction_dust"
            elif (
                ("road" in location or "junction" in location or "roadside" in location)
                and latest.pm10 > 200
                and ratio >= 1.7
            ):
                likely_source = "road_dust"
            elif (
                ("road" in location or "junction" in location or "traffic" in location)
                and latest.pm25 > 100
                and 1.2 <= ratio < 1.7
            ):
                likely_source = "traffic_emissions"
            elif latest.pm25 > 180 and ratio < 1.5:
                likely_source = "burning"
            else:
                likely_source = "mixed_uncertain"

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
                }
            )

    severe_nodes = [n for n in latest_node_states if n["severity"] == "severe"]
    hotspot_nodes = [n for n in latest_node_states if n["is_hotspot"]]

    highest_risk_node = None
    if latest_node_states:
        highest_risk_node = max(latest_node_states, key=lambda x: x["pm25"])

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
    }