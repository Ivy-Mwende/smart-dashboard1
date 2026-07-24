import os
from collections import defaultdict
from datetime import timedelta
from time import time
from functools import wraps

import bcrypt
import jwt
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
from sqlalchemy.exc import SQLAlchemyError

from db import Base, SessionLocal, engine
from ml_utils import build_prediction
from models import Account, AuditLog, MLInsights, Preferences, Transaction, User

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///smart_dashboard.db")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY") or ("dev-secret-change-me" if os.getenv("FLASK_ENV", "development").lower() == "development" else "change-me-in-railway")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_TYPE"] = "Bearer"

JWTManager(app)
allowed_origin = os.getenv("ALLOWED_ORIGIN") or os.getenv("NETLIFY_DOMAIN") or "https://smartdashboard-ivy.netlify.app"
CORS(app, resources={r"/api/*": {"origins": [allowed_origin, "http://localhost:5500", "http://127.0.0.1:5500"]}})

LOGIN_ATTEMPTS = defaultdict(list)


def is_rate_limited(identifier: str, limit: int = 10, window_seconds: int = 60) -> bool:
    now = time()
    attempts = LOGIN_ATTEMPTS[identifier]
    attempts[:] = [attempt for attempt in attempts if now - attempt < window_seconds]
    if len(attempts) >= limit:
        return True
    attempts.append(now)
    return False

try:
    Base.metadata.create_all(bind=engine)
except Exception:
    pass


def get_db():
    return SessionLocal()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def get_current_claims() -> dict:
    token = request.headers.get("Authorization", "")
    if not token.startswith("Bearer "):
        raise ValueError("Missing token")

    encoded_token = token.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(encoded_token, app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError as exc:
        raise ValueError("Token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise ValueError("Invalid token") from exc

    return payload


def jwt_required_or_401(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            claims = get_current_claims()
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 401
        g.current_claims = claims
        g.current_user_id = claims.get("sub")
        return fn(*args, **kwargs)

    wrapper.__name__ = fn.__name__
    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            claims = get_current_claims()
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 401
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        g.current_claims = claims
        g.current_user_id = claims.get("sub")
        return fn(*args, **kwargs)

    wrapper.__name__ = fn.__name__
    return wrapper


@app.route("/")
def home():
    return jsonify({"message": "Smart Dashboard Backend is running!"})


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    db = get_db()
    try:
        if db.query(User).filter(User.email == data.get("email")).first():
            return jsonify({"error": "Email already registered"}), 400

        user = User(
            name=data.get("name", "User"),
            email=data.get("email"),
            password_hash=hash_password(data.get("password", "")),
            role="user",
        )
        db.add(user)
        db.commit()
        return jsonify({"message": "User registered", "user": {"id": user.id, "email": user.email, "role": user.role}}), 201
    except SQLAlchemyError:
        db.rollback()
        app.logger.exception("Registration failed")
        return jsonify({"error": "Registration failed"}), 500
    finally:
        db.close()


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = f"{request.remote_addr}:{(data.get('email') or '').strip().lower()}"
    if is_rate_limited(identifier):
        return jsonify({"error": "Too many login attempts"}), 429

    db = get_db()
    try:
        user = db.query(User).filter(User.email == data.get("email")).first()
        if not user or not verify_password(data.get("password", ""), user.password_hash):
            return jsonify({"error": "Invalid credentials"}), 401
        token = create_access_token(identity=user.id, additional_claims={"role": user.role})
        response = jsonify({"access_token": token, "user": {"id": user.id, "email": user.email, "role": user.role}})
        response.set_cookie(
            "access_token_cookie",
            token,
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=3600,
        )
        return response
    finally:
        db.close()


@app.route("/api/users", methods=["GET"])
@jwt_required_or_401
@admin_required
def list_users():
    db = get_db()
    users = db.query(User).all()
    return jsonify([{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users])


@app.route("/api/accounts", methods=["GET"])
@jwt_required_or_401
def list_accounts():
    db = get_db()
    user_id = int(g.current_user_id)
    items = db.query(Account).filter(Account.user_id == user_id).all()
    return jsonify([{"id": item.id, "account_type": item.account_type, "balance": item.balance} for item in items])


@app.route("/api/accounts", methods=["POST"])
@jwt_required_or_401
def create_account():
    data = request.get_json(silent=True) or {}
    db = get_db()
    user_id = int(g.current_user_id)
    account = Account(user_id=user_id, account_type=data.get("account_type", "checking"), balance=data.get("balance", 0.0))
    db.add(account)
    db.commit()
    return jsonify({"id": account.id, "account_type": account.account_type, "balance": account.balance}), 201


@app.route("/api/transactions", methods=["GET"])
@jwt_required_or_401
def list_transactions():
    db = get_db()
    user_id = int(g.current_user_id)
    accounts = [a.id for a in db.query(Account).filter(Account.user_id == user_id).all()]
    items = db.query(Transaction).filter(Transaction.account_id.in_(accounts)).all()
    return jsonify([{"id": item.id, "amount": item.amount, "description": item.description, "timestamp": item.timestamp.isoformat()} for item in items])


@app.route("/api/preferences", methods=["GET", "POST"])
@jwt_required_or_401
def preferences():
    db = get_db()
    user_id = int(g.current_user_id)
    pref = db.query(Preferences).filter(Preferences.user_id == user_id).first()
    if request.method == "GET":
        return jsonify({"theme": pref.theme if pref else "dark", "notifications_enabled": pref.notifications_enabled if pref else True})

    data = request.get_json(silent=True) or {}
    if not pref:
        pref = Preferences(user_id=user_id, theme=data.get("theme", "dark"), notifications_enabled=data.get("notifications_enabled", True))
        db.add(pref)
    else:
        pref.theme = data.get("theme", pref.theme)
        pref.notifications_enabled = data.get("notifications_enabled", pref.notifications_enabled)
    db.commit()
    return jsonify({"theme": pref.theme, "notifications_enabled": pref.notifications_enabled})


@app.route("/api/insights", methods=["GET"])
@jwt_required_or_401
def insights():
    db = get_db()
    user_id = int(g.current_user_id)
    items = db.query(MLInsights).filter(MLInsights.user_id == user_id).all()
    if not items:
        prediction = build_prediction()
        item = MLInsights(user_id=user_id, prediction=prediction)
        db.add(item)
        db.commit()
        items = [item]
    return jsonify([{"id": item.id, "prediction": item.prediction, "created_at": item.created_at.isoformat()} for item in items])


@app.route("/api/admin/audit", methods=["GET"])
@jwt_required_or_401
@admin_required
def audit_logs():
    db = get_db()
    logs = db.query(AuditLog).all()
    return jsonify([{"id": log.id, "action": log.action, "details": log.details, "timestamp": log.timestamp.isoformat()} for log in logs])


@app.route("/api/admin/log-action", methods=["POST"])
@jwt_required_or_401
@admin_required
def log_action():
    data = request.get_json(silent=True) or {}
    db = get_db()
    log = AuditLog(admin_id=int(g.current_user_id), action=data.get("action", "admin_action"), details=data.get("details", ""))
    db.add(log)
    db.commit()
    return jsonify({"message": "Audit logged", "id": log.id})


if __name__ == "__main__":
    debug = os.getenv("FLASK_ENV", "production").lower() == "development"
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=debug)
