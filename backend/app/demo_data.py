from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.node import Node
from app.models.sensor_reading import SensorReading


DEMO_NODES = [
    {
        "node_id": "WP_NODE_01",
        "ward_id": "WARD-A",
        "location_name": "Green Park Residential Block",
        "latitude": 28.5672,
        "longitude": 77.2100,
        "node_type": "air_noise",
        "pm25": 42.0,
        "pm10": 78.0,
        "temperature": 29.4,
        "humidity": 44.0,
        "battery": 91.0,
        "noise_db": 51.0,
    },
    {
        "node_id": "WP_NODE_02",
        "ward_id": "WARD-A",
        "location_name": "Market Road Corridor",
        "latitude": 28.5704,
        "longitude": 77.2186,
        "node_type": "air_noise",
        "pm25": 88.0,
        "pm10": 164.0,
        "temperature": 30.6,
        "humidity": 41.0,
        "battery": 87.0,
        "noise_db": 69.0,
    },
    {
        "node_id": "WP_NODE_03",
        "ward_id": "WARD-B",
        "location_name": "Construction Edge",
        "latitude": 28.5752,
        "longitude": 77.2248,
        "node_type": "air_noise",
        "pm25": 184.0,
        "pm10": 342.0,
        "temperature": 32.1,
        "humidity": 36.0,
        "battery": 82.0,
        "noise_db": 91.0,
    },
    {
        "node_id": "WP_NODE_04",
        "ward_id": "WARD-B",
        "location_name": "School Gate Traffic Queue",
        "latitude": 28.5800,
        "longitude": 77.2142,
        "node_type": "air_noise",
        "pm25": 132.0,
        "pm10": 210.0,
        "temperature": 31.2,
        "humidity": 39.0,
        "battery": 85.0,
        "noise_db": 74.0,
    },
    {
        "node_id": "WP_NODE_05",
        "ward_id": "WARD-C",
        "location_name": "Hospital Entry Roadside",
        "latitude": 28.5636,
        "longitude": 77.2284,
        "node_type": "air_noise",
        "pm25": 158.0,
        "pm10": 282.0,
        "temperature": 30.9,
        "humidity": 42.0,
        "battery": 79.0,
        "noise_db": 76.0,
    },
    {
        "node_id": "WP_NODE_06",
        "ward_id": "WARD-C",
        "location_name": "Flyover Junction",
        "latitude": 28.5584,
        "longitude": 77.2167,
        "node_type": "air_noise",
        "pm25": 116.0,
        "pm10": 186.0,
        "temperature": 33.0,
        "humidity": 35.0,
        "battery": 84.0,
        "noise_db": 86.0,
    },
    {
        "node_id": "WP_NODE_07",
        "ward_id": "WARD-D",
        "location_name": "Waste Burning Lane",
        "latitude": 28.5728,
        "longitude": 77.2036,
        "node_type": "air_noise",
        "pm25": 286.0,
        "pm10": 330.0,
        "temperature": 32.6,
        "humidity": 37.0,
        "battery": 81.0,
        "noise_db": 58.0,
    },
]

VALUE_WAVE = [-0.18, -0.08, 0.04, -0.12, 0.08, 0.16, -0.05, 0.11, -0.02, 0.18, 0.06, 0.0]
NOISE_WAVE = [-5.0, -2.5, 1.5, -3.0, 2.0, 4.0, -1.0, 3.0, -2.0, 5.0, 1.0, 0.0]


def seed_demo_data(db: Session, history_points: int = 12) -> dict[str, int]:
    nodes_created = 0
    nodes_updated = 0
    readings_created = 0

    for demo_node in DEMO_NODES:
        node = db.query(Node).filter(Node.node_id == demo_node["node_id"]).first()
        node_payload = {
            "node_id": demo_node["node_id"],
            "ward_id": demo_node["ward_id"],
            "location_name": demo_node["location_name"],
            "latitude": demo_node["latitude"],
            "longitude": demo_node["longitude"],
            "node_type": demo_node["node_type"],
            "status": "active",
        }

        if node is None:
            db.add(Node(**node_payload))
            nodes_created += 1
        else:
            for field, value in node_payload.items():
                setattr(node, field, value)
            nodes_updated += 1

    db.flush()

    for demo_node in DEMO_NODES:
        reading_count = (
            db.query(SensorReading)
            .filter(SensorReading.node_id == demo_node["node_id"])
            .count()
        )
        missing_readings = max(history_points - reading_count, 0)
        if missing_readings == 0:
            continue

        earliest_reading = (
            db.query(SensorReading)
            .filter(SensorReading.node_id == demo_node["node_id"])
            .order_by(SensorReading.timestamp.asc())
            .first()
        )
        end_time = (
            earliest_reading.timestamp - timedelta(minutes=5)
            if earliest_reading
            else datetime.utcnow()
        )
        start_time = end_time - timedelta(minutes=5 * (missing_readings - 1))

        for index in range(missing_readings):
            sample_index = (history_points - missing_readings + index) % len(VALUE_WAVE)
            timestamp = start_time + timedelta(minutes=5 * index)
            db.add(_build_reading(demo_node, timestamp, sample_index))
            readings_created += 1

    db.commit()

    return {
        "nodes_created": nodes_created,
        "nodes_updated": nodes_updated,
        "readings_created": readings_created,
    }


def create_demo_simulation_tick(
    db: Session,
    max_readings_per_node: int = 96,
) -> dict[str, int | str]:
    seed_result = seed_demo_data(db, history_points=0)
    timestamp = datetime.utcnow()
    readings_created = 0
    readings_pruned = 0

    for demo_node in DEMO_NODES:
        reading_count = (
            db.query(SensorReading)
            .filter(SensorReading.node_id == demo_node["node_id"])
            .count()
        )
        sample_index = reading_count % len(VALUE_WAVE)
        db.add(_build_reading(demo_node, timestamp, sample_index))
        readings_created += 1

    db.flush()

    for demo_node in DEMO_NODES:
        extra_reading_ids = [
            reading_id
            for (reading_id,) in (
                db.query(SensorReading.id)
                .filter(SensorReading.node_id == demo_node["node_id"])
                .order_by(SensorReading.timestamp.desc(), SensorReading.id.desc())
                .offset(max_readings_per_node)
                .all()
            )
        ]

        if extra_reading_ids:
            readings_pruned += (
                db.query(SensorReading)
                .filter(SensorReading.id.in_(extra_reading_ids))
                .delete(synchronize_session=False)
            )

    db.commit()

    return {
        "timestamp": timestamp.isoformat(),
        "nodes_created": int(seed_result["nodes_created"]),
        "nodes_updated": int(seed_result["nodes_updated"]),
        "readings_created": readings_created,
        "readings_pruned": readings_pruned,
    }


def _build_reading(
    demo_node: dict[str, str | float],
    timestamp: datetime,
    sample_index: int,
) -> SensorReading:
    value_wave = VALUE_WAVE[sample_index % len(VALUE_WAVE)]
    noise_wave = NOISE_WAVE[sample_index % len(NOISE_WAVE)]

    return SensorReading(
        node_id=str(demo_node["node_id"]),
        timestamp=timestamp,
        pm25=_scale(demo_node["pm25"], value_wave),
        pm10=_scale(demo_node["pm10"], value_wave * 0.9),
        temperature=round(float(demo_node["temperature"]) + (value_wave * 5), 2),
        humidity=round(float(demo_node["humidity"]) - (value_wave * 8), 2),
        battery=round(float(demo_node["battery"]) - (sample_index * 0.35), 2),
        noise_db=round(max(float(demo_node["noise_db"]) + noise_wave, 0), 2),
    )


def _scale(value: str | float, wave: float) -> float:
    return round(max(float(value) * (1 + wave), 0), 2)
