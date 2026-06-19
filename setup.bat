@echo off
REM Deployment script for Windows

echo.
echo 🚀 Smart Finance Dashboard - Deployment Helper (Windows)
echo ========================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python first.
    pause
    exit /b 1
)

REM Backend setup
echo 📁 Setting up backend...
cd backend

REM Create virtual environment
python -m venv venv

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Create .env file
echo 📝 Creating .env file...
(
    echo DATABASE_URL=postgresql://smartfinance:secure_password_123@localhost:5432/smart_finance
    echo FLASK_ENV=production
    echo PORT=5000
) > .env

echo ✅ Backend setup complete!
echo 📝 Start the backend with: python app.py
echo.

cd ..

echo ========================================================
echo ✅ Smart Finance Dashboard is ready!
echo ========================================================
echo.
echo 🌐 Backend: http://localhost:5000
echo 🌐 Frontend: http://localhost:8000 (or your frontend server)
echo.
echo 📚 Next steps:
echo 1. Start the backend: cd backend && python app.py
echo 2. Start the frontend: cd frontend && python -m http.server 8000
echo 3. Open http://localhost:8000 in your browser
echo.
pause
