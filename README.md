# Smart Dashboard

A full-stack dashboard starter with Flask backend, PostgreSQL, JWT auth, RBAC, audit logging, ML insights, and a dark-mode frontend.

## Structure

- backend/: Flask API, SQLAlchemy models, seed data, tests
- frontend/: HTML/CSS/JS dashboard UI
- .github/workflows/: CI and deployment workflows

## Quick Start

### Backend

```bash
cd backend
python -m venv ../venv
source ../venv/bin/activate  # Windows: ..\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run lint
npm run format
```

### Docker

```bash
docker compose up --build
```

## Demo API Calls

### Register

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@example.com","password":"secret123","role":"admin"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret123"}'
```

### Accounts

```bash
curl http://localhost:5000/api/accounts -H "Authorization: Bearer <token>"
```
