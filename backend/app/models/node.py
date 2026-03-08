from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class Node(Base):
    __tablename__ = "nodes"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, unique=True, index=True, nullable=False)
    ward_id = Column(String, nullable=False)
    location_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    node_type = Column(String, nullable=False)
    status = Column(String, default="active")