import random
import time
from datetime import datetime, UTC
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1/readings/"

DEMO_NODE_ID = "WP_NODE_03"
DEMO_MODE = "recovery"  # normal | hotspot | recovery

NODES = [
    {
        "node_id": "WP_NODE_01",
        "label": "Green Park Residential",
        "mode": "baseline",
        "pm25_range": (35, 50),
        "pm10_range": (60, 90),
        "noise_range": (45, 55),
    },
    {
        "node_id": "WP_NODE_02",
        "label": "Market Road Corridor",
        "mode": "moderate",
        "pm25_range": (85, 110),
        "pm10_range": (150, 210),
        "noise_range": (68, 78),
    },
    {
        "node_id": "WP_NODE_03",
        "label": "Construction Edge",
        "mode": "demo",
        "normal_pm25_range": (145, 175),
        "normal_pm10_range": (280, 340),
        "normal_noise_range": (78, 92),
        "hotspot_pm25_range": (180, 200),
        "hotspot_pm10_range": (310, 360),
        "hotspot_noise_range": (85, 98),
        "recovery_pm25_range": (95, 120),
        "recovery_pm10_range": (160, 210),
        "recovery_noise_range": (60, 72),
    },
    {
        "node_id": "WP_NODE_04",
        "label": "School Gate",
        "mode": "sensitive",
        "pm25_range": (130, 155),
        "pm10_range": (210, 260),
        "noise_range": (58, 72),
    },
    {
        "node_id": "WP_NODE_05",
        "label": "Hospital Entry",
        "mode": "critical_sensitive",
        "pm25_range": (155, 185),
        "pm10_range": (230, 290),
        "noise_range": (62, 76),
    },
    {
        "node_id": "WP_NODE_06",
        "label": "Flyover Junction",
        "mode": "traffic",
        "pm25_range": (120, 145),
        "pm10_range": (220, 270),
        "noise_range": (75, 90),
    },
    {
        "node_id": "WP_NODE_07",
        "label": "Recurrent Dust Lane",
        "mode": "chronic",
        "pm25_range": (110, 140),
        "pm10_range": (210, 260),
        "noise_range": (65, 80),
    },
]


def get_ranges(node: dict):
    if node["node_id"] == DEMO_NODE_ID and node["mode"] == "demo":
        if DEMO_MODE == "hotspot":
            return (
                node["hotspot_pm25_range"],
                node["hotspot_pm10_range"],
                node["hotspot_noise_range"],
            )
        elif DEMO_MODE == "recovery":
            return (
                node["recovery_pm25_range"],
                node["recovery_pm10_range"],
                node["recovery_noise_range"],
            )
        return (
            node["normal_pm25_range"],
            node["normal_pm10_range"],
            node["normal_noise_range"],
        )

    return node["pm25_range"], node["pm10_range"], node["noise_range"]


while True:
    print(f"\n--- WardPulse Simulator | DEMO_MODE={DEMO_MODE} | DEMO_NODE={DEMO_NODE_ID} ---")
    for node in NODES:
        pm25_range, pm10_range, noise_range = get_ranges(node)

        payload = {
            "node_id": node["node_id"],
            "timestamp": datetime.now(UTC).isoformat(),
            "pm25": round(random.uniform(*pm25_range), 2),
            "pm10": round(random.uniform(*pm10_range), 2),
            "temperature": round(random.uniform(28, 33), 2),
            "humidity": round(random.uniform(35, 48), 2),
            "battery": round(random.uniform(78, 92), 2),
            "noise_db": round(random.uniform(*noise_range), 2),
        }

        try:
            print(payload)
            response = requests.post(BASE_URL, json=payload, timeout=15)
            print(f"{node['node_id']} ({node['label']}) -> {response.status_code}")
        except Exception as e:
            print(f"{node['node_id']} ({node['label']}) -> ERROR -> {e}")

    time.sleep(5)