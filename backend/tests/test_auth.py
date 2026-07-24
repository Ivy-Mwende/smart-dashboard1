import os
import sys

os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app


def test_register_and_login():
    client = app.test_client()
    register_response = client.post(
        "/api/register",
        json={"name": "Test User", "email": "test@example.com", "password": "secret"},
    )
    assert register_response.status_code in (200, 201)

    login_response = client.post(
        "/api/login",
        json={"email": "test@example.com", "password": "secret"},
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.get_json()


def test_register_does_not_allow_admin_role():
    client = app.test_client()
    register_response = client.post(
        "/api/register",
        json={"name": "Test User", "email": "role-test@example.com", "password": "secret", "role": "admin"},
    )
    assert register_response.status_code == 201
    assert register_response.get_json()["user"]["role"] == "user"


def test_users_endpoint_requires_admin():
    client = app.test_client()
    register_response = client.post(
        "/api/register",
        json={"name": "Test User", "email": "admin-check@example.com", "password": "secret"},
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/api/login",
        json={"email": "admin-check@example.com", "password": "secret"},
    )
    token = login_response.get_json()["access_token"]

    users_response = client.get("/api/users", headers={"Authorization": f"Bearer {token}"})
    assert users_response.status_code in (401, 403)
