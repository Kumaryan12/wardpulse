import random
import time
from datetime import datetime, UTC
import requests

BASE_URL = "https://wardpulse.onrender.com/api/v1/readings/"

NODES = [
    {"node_id": "WP_NODE_01", "base_pm25": 110, "base_pm10": 220},
    {"node_id": "WP_NODE_02", "base_pm25": 165, "base_pm10": 320},
    {"node_id": "WP_NODE_03", "base_pm25": 95, "base_pm10": 175},
    {"node_id": "WP_NODE_04", "base_pm25": 135, "base_pm10": 210},
    {"node_id": "WP_NODE_05", "base_pm25": 145, "base_pm10": 230},
    
]

while True:
    for node in NODES:
        payload = {
            "node_id": node["node_id"],
            "timestamp": datetime.now(UTC).isoformat(),
            "pm25": round(node["base_pm25"] + random.uniform(-12, 12), 2),
            "pm10": round(node["base_pm10"] + random.uniform(-25, 25), 2),
            "temperature": round(30 + random.uniform(-2, 2), 2),
            "humidity": round(40 + random.uniform(-6, 6), 2),
            "battery": round(85 + random.uniform(-4, 4), 2),
        }

        try:
            response = requests.post(BASE_URL, json=payload, timeout=15)
            print(f"{node['node_id']} -> {response.status_code} -> {response.text}")
        except Exception as e:
            print(f"{node['node_id']} -> ERROR -> {e}")

    time.sleep(5)