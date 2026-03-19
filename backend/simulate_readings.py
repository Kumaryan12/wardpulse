import random
import time
from datetime import datetime, UTC
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1/readings/"

# Choose which node you want to use for proof + impact demo
DEMO_NODE_ID = "WP_NODE_03"

# Change this during demo:
# "normal"   -> regular behavior
# "hotspot"  -> selected demo node becomes severe
# "recovery" -> selected demo node improves after intervention
DEMO_MODE = "normal"

NODES = [
    {
        "node_id": "WP_NODE_01",
        "label": "Green Park Residential",
        "mode": "baseline",
        "pm25_range": (35, 50),
        "pm10_range": (60, 90),
    },
    {
        "node_id": "WP_NODE_02",
        "label": "Market Road Corridor",
        "mode": "moderate",
        "pm25_range": (85, 110),
        "pm10_range": (150, 210),
    },
    {
        "node_id": "WP_NODE_03",
        "label": "Construction Edge",
        "mode": "demo",
        "normal_pm25_range": (145, 175),
        "normal_pm10_range": (280, 340),
        "hotspot_pm25_range": (165, 190),
        "hotspot_pm10_range": (310, 360),
        "recovery_pm25_range": (95, 120),
        "recovery_pm10_range": (160, 210),
    },
    {
        "node_id": "WP_NODE_04",
        "label": "School Gate",
        "mode": "sensitive",
        "pm25_range": (130, 155),
        "pm10_range": (210, 260),
    },
    {
        "node_id": "WP_NODE_05",
        "label": "Hospital Entry",
        "mode": "critical_sensitive",
        "pm25_range": (155, 185),
        "pm10_range": (230, 290),
    },
    {
        "node_id": "WP_NODE_06",
        "label": "Flyover Junction",
        "mode": "traffic",
        "pm25_range": (120, 145),
        "pm10_range": (220, 270),
    },
    {
        "node_id": "WP_NODE_07",
        "label": "Recurrent Dust Lane",
        "mode": "chronic",
        "pm25_range": (110, 140),
        "pm10_range": (210, 260),
    },
]


def get_ranges(node: dict):
    if node["node_id"] == DEMO_NODE_ID and node["mode"] == "demo":
        if DEMO_MODE == "hotspot":
            return node["hotspot_pm25_range"], node["hotspot_pm10_range"]
        elif DEMO_MODE == "recovery":
            return node["recovery_pm25_range"], node["recovery_pm10_range"]
        return node["normal_pm25_range"], node["normal_pm10_range"]

    return node["pm25_range"], node["pm10_range"]


while True:
    print(f"\n--- WardPulse Simulator Running | DEMO_MODE={DEMO_MODE} | DEMO_NODE={DEMO_NODE_ID} ---")
    for node in NODES:
        pm25_range, pm10_range = get_ranges(node)

        payload = {
            "node_id": node["node_id"],
            "timestamp": datetime.now(UTC).isoformat(),
            "pm25": round(random.uniform(*pm25_range), 2),
            "pm10": round(random.uniform(*pm10_range), 2),
            "temperature": round(random.uniform(28, 33), 2),
            "humidity": round(random.uniform(35, 48), 2),
            "battery": round(random.uniform(78, 92), 2),
        }

        try:
            response = requests.post(BASE_URL, json=payload, timeout=15)
            print(f"{node['node_id']} ({node['label']}) -> {response.status_code}")
        except Exception as e:
            print(f"{node['node_id']} ({node['label']}) -> ERROR -> {e}")

    time.sleep(5)