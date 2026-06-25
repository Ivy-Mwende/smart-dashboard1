import os
import sys

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
