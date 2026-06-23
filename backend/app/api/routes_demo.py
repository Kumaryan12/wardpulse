from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import (
    DEMO_SIMULATION_ENABLED,
    DEMO_SIMULATION_MAX_READINGS_PER_NODE,
)
from app.database import get_db
from app.demo_data import create_demo_simulation_tick

router = APIRouter(prefix="/api/v1/demo", tags=["Demo"])


@router.post("/simulate-tick")
def simulate_demo_tick(db: Session = Depends(get_db)):
    if not DEMO_SIMULATION_ENABLED:
        raise HTTPException(status_code=403, detail="Demo simulation is disabled")

    return create_demo_simulation_tick(
        db,
        max_readings_per_node=DEMO_SIMULATION_MAX_READINGS_PER_NODE,
    )
