# Smart Finance Dashboard

A production-ready full-stack financial management application with real-time analytics, expense tracking, and income management.

**Live Demo:** Coming Soon  
**Repository:** [GitHub Repository](#)

## 🎯 Features

- ✅ User Authentication (Register & Login)
- ✅ Income & Expense Tracking
- ✅ Real-time Financial Summary
- ✅ Interactive Charts (Pie & Bar charts)
- ✅ Responsive Design (Mobile-first)
- ✅ PostgreSQL Database
- ✅ RESTful API with Flask
- ✅ Secure Password Hashing
- ✅ Production-ready Deployment

## 🏗️ Architecture

### Tech Stack
- **Backend:** Python, Flask, PostgreSQL
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Charts:** Chart.js
- **Deployment:** Render (Backend), Vercel (Frontend)

### Project Structure
```
smart-finance-dashboard/
├── backend/
│   ├── app.py              # Flask application with API routes
│   ├── requirements.txt     # Python dependencies
│   ├── Procfile            # Render deployment config
│   ├── .env.example        # Environment variables template
│   └── .gitignore          # Git ignore rules
├── frontend/
│   ├── index.html          # Login page
│   ├── dashboard.html      # Main dashboard page
│   ├── styles.css          # Responsive styling
│   ├── app.js              # Frontend logic & API calls
│   └── .gitignore          # Git ignore rules
├── schema.sql              # Database schema
├── README.md               # This file
└── .gitignore              # Root git ignore
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- Node.js (for frontend development)
- Git

### Local Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/smart-finance-dashboard.git
cd smart-finance-dashboard
```

#### 2. Setup PostgreSQL Database

**Option A: Using Render PostgreSQL (Recommended)**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "Create" → "PostgreSQL"
3. Fill in the details:
   - Name: `smart-finance-db`
   - PostgreSQL Version: Latest
   - Plan: Free tier
4. Once created, copy the `Internal Database URL`
5. Run the schema:
   ```sql
   -- Connect to your database and paste the contents of schema.sql
   ```

**Option B: Local PostgreSQL**
```bash
# Create database
createdb smart_finance

# Create schema
psql smart_finance < schema.sql
```

#### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your database URL
# DATABASE_URL=postgresql://user:password@localhost:5432/smart_finance
nano .env

# Run locally
python app.py
```

Backend will be available at: `http://localhost:5000`

#### 4. Frontend Setup
```bash
cd ../frontend

# Start a local web server (Python)
python -m http.server 8000

# Or use Node.js http-server
npx http-server .
```

Frontend will be available at: `http://localhost:8000`

## 📚 API Documentation

### Authentication

#### Register
```bash
POST /api/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure_password"
}

Response:
{
  "message": "User registered successfully",
  "token": "john_doe:hash..."
}
```

#### Login
```bash
POST /api/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure_password"
}

Response:
{
  "message": "Login successful",
  "token": "john_doe:hash..."
}
```

### Endpoints (Requires Authorization Header)

All endpoints require the `Authorization` header with the token:
```
Authorization: john_doe:hash...
```

#### Add Expense
```bash
POST /api/expenses
Content-Type: application/json
Authorization: token

{
  "name": "Groceries",
  "amount": 45.50
}

Response:
{
  "message": "Expense added successfully",
  "expense": {
    "id": 1,
    "name": "Groceries",
    "amount": 45.50,
    "created_at": "2024-01-15T10:30:00"
  }
}
```

#### Get All Expenses
```bash
GET /api/expenses
Authorization: token

Response:
{
  "expenses": [
    {
      "id": 1,
      "name": "Groceries",
      "amount": 45.50,
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

#### Add Income
```bash
POST /api/income
Content-Type: application/json
Authorization: token

{
  "source": "Salary",
  "amount": 5000.00
}

Response:
{
  "message": "Income added successfully",
  "income": {
    "id": 1,
    "source": "Salary",
    "amount": 5000.00,
    "created_at": "2024-01-15T10:30:00"
  }
}
```

#### Get Financial Summary
```bash
GET /api/summary
Authorization: token

Response:
{
  "total_income": 5000.00,
  "total_expenses": 150.75,
  "balance": 4849.25,
  "expenses": [...],
  "income": [...]
}
```

#### Delete Expense
```bash
DELETE /api/expenses/<id>
Authorization: token

Response:
{
  "message": "Expense deleted successfully"
}
```

#### Delete Income
```bash
DELETE /api/income/<id>
Authorization: token

Response:
{
  "message": "Income deleted successfully"
}
```

#### Health Check
```bash
GET /api/health

Response:
{
  "status": "healthy"
}
```

## 🌐 Deployment

### Deploy Backend to Render

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Render Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "Create" → "Web Service"
   - Connect your GitHub repository
   - Fill in the details:
     - Name: `smart-finance-backend`
     - Environment: Python
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `gunicorn backend.app:app`
     - Root Directory: `backend`

3. **Add Environment Variables**
   - In Render dashboard, go to "Environment"
   - Add `DATABASE_URL`: Your PostgreSQL URL from Render
   - Add `FLASK_ENV`: `production`

4. **Deploy**
   - Click "Deploy"
   - Once deployed, note your backend URL (e.g., `https://smart-finance-backend.onrender.com`)

### Deploy Frontend to Vercel

1. **Update API URL in Frontend**
   - Edit `frontend/app.js`
   - Change `API_BASE_URL` to your Render backend URL:
   ```javascript
   const API_BASE_URL = 'https://smart-finance-backend.onrender.com';
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Set Root Directory: `frontend`
   - Click "Deploy"

3. **Access the Application**
   - Your app will be available at: `https://smart-finance-xxxxx.vercel.app`

## 🔒 Security Notes

- Passwords are hashed using SHA256 (for demo purposes; use bcrypt in production)
- Implement HTTPS/SSL for all deployments
- Enable CORS only for your frontend domain
- Validate and sanitize all user inputs
- Use environment variables for sensitive data
- Consider implementing JWT tokens for better security
- Add rate limiting to prevent abuse
- Enable database backups

## 🧪 Testing

### Test the API with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'

# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'

# Add Expense (replace TOKEN with actual token)
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: TOKEN" \
  -d '{"name": "Groceries", "amount": 50}'

# Get Summary
curl -X GET http://localhost:5000/api/summary \
  -H "Authorization: TOKEN"
```

## 🐛 Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` is correct in `.env`
- Check if PostgreSQL is running
- Ensure database exists and schema is initialized

### CORS Errors
- Add your frontend domain to CORS in `backend/app.py`
- For local development, CORS is enabled for all origins

### Port Already in Use
```bash
# Find process using port 5000 (macOS/Linux)
lsof -i :5000
kill -9 <PID>

# For Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend API 404
- Ensure `API_BASE_URL` in `frontend/app.js` points to correct backend
- Check if backend is running and accessible
- Verify CORS headers are present

## 📈 Future Enhancements

- [ ] Budget categories with limits
- [ ] Recurring transactions
- [ ] Export reports (PDF/CSV)
- [ ] Multi-currency support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and forecasting
- [ ] Notification system
- [ ] Multi-user support with shared budgets
- [ ] OAuth2 authentication
- [ ] Transaction tagging and search

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@smartfinance.com or open an issue in the repository.

## 🎓 Learning Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)

---

**Created with ❤️ for financial management enthusiasts**

Last Updated: January 2024
