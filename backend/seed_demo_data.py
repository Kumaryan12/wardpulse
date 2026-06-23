from app.config import DEMO_HISTORY_POINTS
from app.database import Base, SessionLocal, engine
from app.demo_data import seed_demo_data


def main() -> None:
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        result = seed_demo_data(db, history_points=DEMO_HISTORY_POINTS)
    finally:
        db.close()

    print(f"WardPulse demo data ready: {result}")


if __name__ == "__main__":
    main()
