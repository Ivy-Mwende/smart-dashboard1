# DEPLOYMENT.md - Complete Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Docker Setup](#docker-setup)
3. [Backend Deployment to Render](#backend-deployment-to-render)
4. [Frontend Deployment to Vercel](#frontend-deployment-to-vercel)
5. [Database Setup on Render](#database-setup-on-render)
6. [Post-Deployment Configuration](#post-deployment-configuration)

## Local Development Setup

### Prerequisites
- Python 3.8 or higher
- PostgreSQL 12+ (or use Docker)
- Git
- A code editor (VS Code recommended)

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/smart-finance-dashboard.git
cd smart-finance-dashboard
```

### Step 2: Backend Setup

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
bash setup.sh
```

**Manual Setup:**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your DATABASE_URL
```

### Step 3: Database Setup

**Option A: Using Docker (Recommended for local dev)**
```bash
# Make sure Docker is installed and running
docker-compose up -d

# This creates a PostgreSQL container automatically
# DATABASE_URL=postgresql://smartfinance:secure_password_123@localhost:5432/smart_finance
```

**Option B: Local PostgreSQL**
```bash
# Create database
createdb smart_finance

# Connect and run schema
psql smart_finance < schema.sql
```

### Step 4: Run Backend
```bash
cd backend
python app.py
```
Backend runs on: `http://localhost:5000`

### Step 5: Run Frontend
**In a new terminal:**
```bash
cd frontend

# Python 3
python -m http.server 8000

# Or use Node.js if you have it installed
npx http-server
```
Frontend runs on: `http://localhost:8000`

## Docker Setup

### Prerequisites
- Docker Desktop installed
- Docker Compose

### Quick Start with Docker
```bash
# Start the entire stack
docker-compose up -d

# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs -f

# Stop the stack
docker-compose down

# Remove volumes (clears database)
docker-compose down -v
```

## Backend Deployment to Render

### Step 1: Create Render Account
- Go to [Render](https://render.com)
- Sign up with GitHub account

### Step 2: Connect GitHub Repository
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "Create" → "Web Service"
3. Select "Connect a repository"
4. Choose your smart-finance-dashboard repository

### Step 3: Configure Web Service

Fill in the following details:

| Field | Value |
|-------|-------|
| **Name** | `smart-finance-backend` |
| **Environment** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn backend.app:app` |
| **Root Directory** | `backend` |
| **Plan** | Free (or Paid for production) |

### Step 4: Add Environment Variables

In the "Environment" section, add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your PostgreSQL URL (see Database Setup) |
| `FLASK_ENV` | `production` |
| `FLASK_DEBUG` | `False` |

### Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically deploy your application
3. Wait for the deployment to complete
4. Copy the URL (e.g., `https://smart-finance-backend.onrender.com`)

### Step 6: Monitor Deployment

- Check deployment logs in Render dashboard
- Test health endpoint: `https://smart-finance-backend.onrender.com/api/health`

## Frontend Deployment to Vercel

### Step 1: Create Vercel Account
- Go to [Vercel](https://vercel.com)
- Sign up with GitHub

### Step 2: Update API URL

Before deploying, update the backend URL in your frontend:

Edit `frontend/app.js`:
```javascript
const API_BASE_URL = 'https://your-backend-url.onrender.com';
```

### Step 3: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Configure project:
   - **Project Name**: `smart-finance-dashboard`
   - **Root Directory**: `frontend`
   - **Build Command**: (leave empty for static site)
   - **Output Directory**: (leave empty)

5. Click "Deploy"

### Step 4: Configure Environment Variables (Optional)

If you need to store the backend URL as an environment variable:

1. Go to project settings
2. Add environment variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-backend-url.onrender.com`

### Step 5: Test Deployment

- Visit your Vercel URL
- Register a new account
- Add some transactions
- Verify data appears in charts and tables

## Database Setup on Render

### Option 1: Using Render PostgreSQL (Recommended)

1. **Create PostgreSQL Database:**
   - Go to Render Dashboard
   - Click "Create" → "PostgreSQL"
   - Fill in:
     - **Name**: `smart-finance-db`
     - **Database**: `smart_finance`
     - **User**: `smartfinance`
     - **Region**: Select closest to you
     - **PostgreSQL Version**: Latest
     - **Plan**: Free or Paid

2. **Initialize Schema:**
   - Once database is created, click on it
   - Go to "Connections" tab
   - Copy the "External Database URL"
   - In your local terminal:
     ```bash
     psql "your-external-url" < schema.sql
     ```

3. **Add to Backend Service:**
   - Copy the "Internal Database URL"
   - Add as `DATABASE_URL` environment variable in backend service

### Option 2: Using External PostgreSQL

You can use services like:
- [ElephantSQL](https://www.elephantsql.com/)
- [Railway](https://railway.app/)
- [Supabase](https://supabase.com/)

## Post-Deployment Configuration

### 1. Enable CORS for Production

Update `backend/app.py` to add your frontend domain:

```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": ["https://your-frontend-domain.vercel.app"]
    }
})
```

### 2. Test All Endpoints

```bash
# Test health check
curl https://your-backend.onrender.com/api/health

# Test registration
curl -X POST https://your-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'

# Test login
curl -X POST https://your-backend.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'
```

### 3. Monitor Application

- **Render**: Check logs in dashboard
- **Vercel**: Check deployment status and analytics
- **Database**: Monitor query performance and backups

### 4. Setup Automated Backups

For Render PostgreSQL:
- Enable automated backups (7-day retention on free plan)

### 5. Custom Domain Setup

**For Backend (Render):**
1. Go to Service Settings
2. Custom Domain section
3. Add your domain (requires DNS setup)

**For Frontend (Vercel):**
1. Go to Project Settings
2. Domains
3. Add your domain

### 6. SSL/HTTPS

Both Render and Vercel provide automatic SSL certificates.

## Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version

# Check dependencies
pip list

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Database Connection Error
```bash
# Test connection string locally
psql "your-database-url"

# Check environment variables are set
echo $DATABASE_URL
```

### Frontend Shows CORS Error
- Check backend CORS configuration
- Verify frontend URL is in CORS allowed origins
- Test API endpoint directly in browser

### Vercel Build Fails
- Check build logs in Vercel dashboard
- Ensure all required files are in `frontend/` directory
- Verify `vercel.json` configuration

## Performance Optimization

1. **Backend:**
   - Enable response caching
   - Add database indexes (included in schema.sql)
   - Use connection pooling

2. **Frontend:**
   - Minify CSS and JavaScript
   - Use lazy loading for charts
   - Optimize images

3. **Database:**
   - Regular VACUUM and ANALYZE
   - Archive old transactions
   - Monitor slow queries

## Security Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS/SSL on all services
- [ ] Set strong database passwords
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Add rate limiting
- [ ] Implement CSRF protection
- [ ] Use secure cookies (HttpOnly, Secure flags)
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Support

- Check Render documentation: https://render.com/docs
- Check Vercel documentation: https://vercel.com/docs
- Check PostgreSQL documentation: https://www.postgresql.org/docs/

---

**Last Updated**: January 2024
