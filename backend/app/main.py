import logging
import os
from app.api.routes_memory import router as memory_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import ALLOWED_ORIGINS, DEMO_DATA_ENABLED, DEMO_HISTORY_POINTS, UPLOAD_DIR
from app.database import Base, SessionLocal, engine
from app.api.routes_briefs import router as briefs_router
from app.api.routes_nodes import router as nodes_router
from app.api.routes_readings import router as readings_router
from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_demo import router as demo_router
from app.api.routes_tickets import router as tickets_router
from app.api.routes_proofs import router as proofs_router
from app.api.routes_impact import router as impact_router

from app.api.routes_advisories import router as advisories_router
from app.models.node import Node
from app.models.sensor_reading import SensorReading
from app.models.ticket import Ticket
from app.models.proof_log import ProofLog
from app.models.impact_report import ImpactReport
from app.api.routes_notifications import router as notifications_router
from app.demo_data import seed_demo_data

logger = logging.getLogger(__name__)
os.makedirs(UPLOAD_DIR, exist_ok=True)

Base.metadata.create_all(bind=engine)

if DEMO_DATA_ENABLED:
    db = SessionLocal()
    try:
        seed_result = seed_demo_data(db, history_points=DEMO_HISTORY_POINTS)
        logger.info("Seeded WardPulse demo data: %s", seed_result)
    finally:
        db.close()

app = FastAPI(title="WardPulse Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(nodes_router)
app.include_router(readings_router)
app.include_router(dashboard_router)
app.include_router(demo_router)
app.include_router(tickets_router)
app.include_router(proofs_router)
app.include_router(impact_router)
app.include_router(briefs_router)
app.include_router(memory_router)
app.include_router(advisories_router)
app.include_router(notifications_router)

@app.get("/")
def root():
    return {"message": "WardPulse backend is running"}
