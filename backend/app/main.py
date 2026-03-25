import os
from app.api.routes_memory import router as memory_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import ALLOWED_ORIGINS, UPLOAD_DIR
from app.database import Base, engine
from app.api.routes_briefs import router as briefs_router
from app.api.routes_nodes import router as nodes_router
from app.api.routes_readings import router as readings_router
from app.api.routes_dashboard import router as dashboard_router
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
os.makedirs(UPLOAD_DIR, exist_ok=True)

Base.metadata.create_all(bind=engine)

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