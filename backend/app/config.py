import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("POSTGRES_URL")
    or "sqlite:///./wardpulse.db"
)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

DEMO_DATA_ENABLED = os.getenv("DEMO_DATA_ENABLED", "true").lower() in {
    "1",
    "true",
    "yes",
    "on",
}

DEMO_HISTORY_POINTS = int(os.getenv("DEMO_HISTORY_POINTS", "12"))

DEMO_SIMULATION_ENABLED = os.getenv(
    "DEMO_SIMULATION_ENABLED",
    "true" if DEMO_DATA_ENABLED else "false",
).lower() in {
    "1",
    "true",
    "yes",
    "on",
}

DEMO_SIMULATION_MAX_READINGS_PER_NODE = int(
    os.getenv("DEMO_SIMULATION_MAX_READINGS_PER_NODE", "96")
)

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]

UPLOAD_DIR = os.getenv(
    "UPLOAD_DIR",
    "/tmp/wardpulse-uploads" if os.getenv("VERCEL") else "uploads",
)
