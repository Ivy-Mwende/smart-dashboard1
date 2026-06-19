# Quick Start Guide - Smart Finance Dashboard

## 🎯 Get Started in 5 Minutes

### Prerequisites Checklist
- ✅ Python 3.8+ installed
- ✅ PostgreSQL installed (or Docker)
- ✅ Git installed
- ✅ Code editor (VS Code recommended)

---

## Step 1: Clone & Navigate
```bash
git clone <your-repo-url>
cd smart-finance-dashboard
```

---

## Step 2: Choose Your Setup

### Option A: Quick Start with Docker (Recommended)

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
bash setup.sh
```

This will:
- Start PostgreSQL in Docker
- Create Python virtual environment
- Install all dependencies
- Generate .env file

### Option B: Manual Setup

```bash
# Backend setup
cd backend
python -m venv venv

# Activate
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install
pip install -r requirements.txt
cp .env.example .env

# Database (in another terminal)
# Create database
createdb smart_finance
psql smart_finance < ../schema.sql
```

---

## Step 3: Run Backend

```bash
# From backend directory (with venv activated)
python app.py
```

✅ Backend available at: `http://localhost:5000`

---

## Step 4: Run Frontend

**In a new terminal:**
```bash
cd frontend
python -m http.server 8000
```

✅ Frontend available at: `http://localhost:8000`

---

## Step 5: Test the Application

1. Open `http://localhost:8000` in your browser
2. Register a new account
3. Login with credentials
4. Add some income and expenses
5. View the dashboard with charts

---

## 📝 Example API Requests

### Register
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "password": "demo123456"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "password": "demo123456"
  }'
```
Returns: `{"token": "demo:hash..."}`

### Add Income (use token from login)
```bash
curl -X POST http://localhost:5000/api/income \
  -H "Content-Type: application/json" \
  -H "Authorization: demo:hash..." \
  -d '{
    "source": "Salary",
    "amount": 5000
  }'
```

### Get Summary
```bash
curl http://localhost:5000/api/summary \
  -H "Authorization: demo:hash..."
```

---

## 🐛 Troubleshooting

### "Address already in use"
```bash
# Find and kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### "Cannot connect to database"
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- For Docker: `docker-compose ps` (should show postgres)

### "Module not found"
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### "CORS Error"
- Backend and frontend should be on different ports
- CORS is enabled in app.py by default

---

## 🚀 Deploy to Cloud

### Deploy Backend to Render

1. Push to GitHub
2. Go to https://dashboard.render.com/
3. Create Web Service
4. Select repository
5. Fill in:
   - Name: `smart-finance-backend`
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn backend.app:app`
6. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL URL
7. Deploy!

### Deploy Frontend to Vercel

1. Update API URL in `frontend/app.js`:
   ```javascript
   const API_BASE_URL = 'https://your-backend.onrender.com';
   ```
2. Go to https://vercel.com
3. Import project
4. Set root directory to `frontend`
5. Deploy!

---

## 📚 Project Structure

```
smart-finance-dashboard/
├── backend/
│   ├── app.py                 # Flask API
│   ├── requirements.txt        # Dependencies
│   ├── Procfile               # Render config
│   └── .env.example           # Environment template
├── frontend/
│   ├── index.html             # Login page
│   ├── dashboard.html         # Dashboard page
│   ├── app.js                 # Frontend logic
│   ├── styles.css             # Styling
│   └── vercel.json            # Vercel config
├── schema.sql                 # Database schema
├── docker-compose.yml         # Docker config
├── DEPLOYMENT.md              # Detailed deployment
├── README.md                  # Full documentation
└── setup.bat/.sh              # Quick setup scripts
```

---

## 🔑 Default Database Credentials (Docker)

- **User**: `smartfinance`
- **Password**: `secure_password_123`
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `smart_finance`

Change these in `docker-compose.yml` for production!

---

## ✨ Features

- 👤 User authentication (register/login)
- 💰 Income tracking
- 💸 Expense tracking
- 📊 Interactive charts
- 📱 Responsive design
- 🔒 Password hashing
- 📈 Financial summary
- 🗑️ Delete transactions

---

## 🎓 Learn More

- [Full README.md](README.md) - Complete documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [Backend API Routes](README.md#-api-documentation)

---

## 📞 Need Help?

1. Check troubleshooting section above
2. Review DEPLOYMENT.md for detailed setup
3. Check console logs for error messages
4. Review API responses in browser DevTools

---

**Happy budgeting! 💰**
