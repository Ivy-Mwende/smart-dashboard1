from db import Base, engine


def run_migrations():
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized")


if __name__ == "__main__":
    run_migrations()
