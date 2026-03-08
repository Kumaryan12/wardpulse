from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.node import Node
from app.schemas.node_schema import NodeCreate, NodeResponse

router = APIRouter(prefix="/api/v1/nodes", tags=["Nodes"])


@router.post("/register", response_model=NodeResponse)
def register_node(node: NodeCreate, db: Session = Depends(get_db)):
    existing = db.query(Node).filter(Node.node_id == node.node_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Node already exists")

    db_node = Node(**node.model_dump(), status="active")
    db.add(db_node)
    db.commit()
    db.refresh(db_node)
    return db_node


@router.get("/", response_model=list[NodeResponse])
def get_nodes(db: Session = Depends(get_db)):
    return db.query(Node).all()