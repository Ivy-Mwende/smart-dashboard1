from app import app
from db import SessionLocal
from models import Account, AuditLog, MLInsights, Preferences, Transaction, User


def seed_demo_data():
    db = SessionLocal()
    db.query(Transaction).delete()
    db.query(Account).delete()
    db.query(Preferences).delete()
    db.query(MLInsights).delete()
    db.query(AuditLog).delete()
    db.query(User).delete()

    admin = User(name="Admin User", email="admin@example.com", password_hash="hashed", role="admin")
    user = User(name="Jane Doe", email="jane@example.com", password_hash="hashed", role="user")
    db.add_all([admin, user])
    db.commit()

    db.add_all([
        Account(user_id=admin.id, account_type="checking", balance=5400.0),
        Account(user_id=user.id, account_type="savings", balance=3200.0),
    ])
    db.commit()

    account = db.query(Account).first()
    db.add_all([
        Transaction(account_id=account.id, amount=-120.0, description="Groceries"),
        Transaction(account_id=account.id, amount=2500.0, description="Salary"),
    ])
    db.add_all([
        Preferences(user_id=admin.id, theme="dark", notifications_enabled=True),
        MLInsights(user_id=user.id, prediction="Spending will rise by 8% next month"),
        AuditLog(admin_id=admin.id, action="seed_demo", details="Seeded demo data"),
    ])
    db.commit()
    db.close()


if __name__ == "__main__":
    with app.app_context():
        seed_demo_data()
        print("Demo data seeded")
