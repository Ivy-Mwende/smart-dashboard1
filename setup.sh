#!/usr/bin/env bash
# Deployment script for local testing

echo "🚀 Smart Finance Dashboard - Deployment Helper"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting PostgreSQL with Docker...${NC}"
docker-compose up -d

echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 5

echo -e "${YELLOW}Installing Python dependencies...${NC}"
cd backend
python -m venv venv

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    venv\Scripts\activate
else
    source venv/bin/activate
fi

pip install -r requirements.txt

echo -e "${YELLOW}Creating .env file...${NC}"
cat > .env << EOF
DATABASE_URL=postgresql://smartfinance:secure_password_123@localhost:5432/smart_finance
FLASK_ENV=production
PORT=5000
EOF

echo -e "${GREEN}✅ Backend setup complete!${NC}"
echo -e "${GREEN}📝 Start the backend with: python app.py${NC}"

cd ../frontend
echo -e "${GREEN}✅ Frontend is ready!${NC}"
echo -e "${GREEN}📝 Start the frontend with: python -m http.server 8000${NC}"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Backend: http://localhost:5000${NC}"
echo -e "${GREEN}Frontend: http://localhost:8000${NC}"
echo -e "${GREEN}================================================${NC}"
