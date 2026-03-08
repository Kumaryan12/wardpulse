import random
import time
from datetime import datetime
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1/readings/"

NODES = [
    {"node_id": "WP_NODE_01", "base_pm25": 110, "base_pm10": 220},
    {"node_id": "WP_NODE_02", "base_pm25": 160, "base_pm10": 310},
    {"node_id": "WP_NODE_03", "base_pm25": 90, "base_pm10": 170},
]

while True:
    for node in NODES:
        payload = {
            "node_id": node["node_id"],
            "timestamp": datetime.utcnow().isoformat(),
            "pm25": round(node["base_pm25"] + random.uniform(-10, 10), 2),
            "pm10": round(node["base_pm10"] + random.uniform(-20, 20), 2),
            "temperature": round(30 + random.uniform(-2, 2), 2),
            "humidity": round(40 + random.uniform(-5, 5), 2),
            "battery": round(85 + random.uniform(-3, 3), 2),
        }

        try:
            response = requests.post(BASE_URL, json=payload)
            print("URL:", BASE_URL)
            print("Status:", response.status_code)
            print("Response:", response.text)
        except Exception as e:
            print("Error:", e)

    time.sleep(5)