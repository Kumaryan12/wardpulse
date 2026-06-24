from __future__ import annotations

import argparse
import random
import time
from datetime import datetime, timezone

import requests


MODES = {
    "hotspot": {
        "pm25": (182, 205),
        "pm10": (318, 365),
        "noise_db": (86, 98),
    },
    "recovery": {
        "pm25": (92, 116),
        "pm10": (158, 205),
        "noise_db": (60, 72),
    },
}


def build_reading(node_id: str, mode: str) -> dict[str, float | str]:
    ranges = MODES[mode]
    return {
        "node_id": node_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "pm25": round(random.uniform(*ranges["pm25"]), 2),
        "pm10": round(random.uniform(*ranges["pm10"]), 2),
        "temperature": round(random.uniform(29, 33), 2),
        "humidity": round(random.uniform(36, 48), 2),
        "battery": round(random.uniform(82, 94), 2),
        "noise_db": round(random.uniform(*ranges["noise_db"]), 2),
    }


def normalize_api_base(api_base: str) -> str:
    return api_base.rstrip("/")


def post_readings(api_base: str, node_id: str, mode: str, count: int, interval: float) -> None:
    api_base = normalize_api_base(api_base)
    readings_url = f"{api_base}/readings/"

    print(f"Posting {count} {mode} readings to {readings_url}")
    for index in range(count):
        payload = build_reading(node_id=node_id, mode=mode)
        response = requests.post(readings_url, json=payload, timeout=20)
        response.raise_for_status()
        print(
            f"{index + 1}/{count} {node_id}: "
            f"PM2.5={payload['pm25']} PM10={payload['pm10']} Noise={payload['noise_db']}"
        )
        if index < count - 1:
            time.sleep(interval)


def recalculate_impact(api_base: str, ticket_id: int) -> None:
    impact_url = f"{normalize_api_base(api_base)}/impact/{ticket_id}"
    response = requests.post(impact_url, timeout=30)
    response.raise_for_status()
    report = response.json()
    print("\nImpact report refreshed")
    print(f"Ticket: {report['ticket_id']}")
    print(f"Weighted impact: {report['improvement_percent']}%")
    print(f"Effectiveness score: {report['effectiveness_score']}/100")
    print(f"Verdict: {report['verdict']}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Push WardPulse production demo readings before or after a cleanup proof."
    )
    parser.add_argument(
        "--api-base",
        required=True,
        help="Production API base URL, for example https://your-backend.vercel.app/api/v1",
    )
    parser.add_argument("--node-id", default="WP_NODE_03")
    parser.add_argument("--mode", choices=sorted(MODES), default="recovery")
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument("--interval", type=float, default=2)
    parser.add_argument(
        "--ticket-id",
        type=int,
        help="Optional ticket id to recalculate after posting readings.",
    )
    args = parser.parse_args()

    post_readings(
        api_base=args.api_base,
        node_id=args.node_id,
        mode=args.mode,
        count=args.count,
        interval=args.interval,
    )

    if args.ticket_id:
        recalculate_impact(api_base=args.api_base, ticket_id=args.ticket_id)


if __name__ == "__main__":
    main()
