#!/bin/bash

# Start Local Development Script
# Budget Insights Platform

set -e

echo "🚀 Starting Budget Insights Platform locally..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Stop any existing services
echo -e "${YELLOW}Stopping any existing services...${NC}"
pkill -f "python3 app.py" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
sleep 2

# Check if virtual environments exist, create if not
if [ ! -d "services/transaction-service/venv" ]; then
    echo -e "${BLUE}Creating virtual environment for transaction service...${NC}"
    cd services/transaction-service
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt
    cd ../..
fi

if [ ! -d "services/analytics-service/venv" ]; then
    echo -e "${BLUE}Creating virtual environment for analytics service...${NC}"
    cd services/analytics-service
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt
    cd ../..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd frontend
    npm install --silent
    cd ..
fi

# Start Transaction Service
echo -e "${GREEN}Starting Transaction Service on port 5001...${NC}"
cd services/transaction-service
source venv/bin/activate
python3 app.py > /tmp/transaction-service.log 2>&1 &
TRANSACTION_PID=$!
cd ../..
sleep 2

# Start Analytics Service
echo -e "${GREEN}Starting Analytics Service on port 5002...${NC}"
cd services/analytics-service
source venv/bin/activate
export TRANSACTION_SERVICE_URL=http://localhost:5001
python3 app.py > /tmp/analytics-service.log 2>&1 &
ANALYTICS_PID=$!
cd ../..
sleep 2

# Start Frontend
echo -e "${GREEN}Starting Frontend on port 3000...${NC}"
cd frontend
REACT_APP_API_BASE_URL=http://localhost:5001 \
REACT_APP_ANALYTICS_BASE_URL=http://localhost:5002 \
npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for services to be ready
echo ""
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 5

# Check health
if curl -s http://localhost:5001/health > /dev/null; then
    echo -e "${GREEN}✅ Transaction Service: Healthy${NC}"
else
    echo -e "${YELLOW}⏳ Transaction Service: Starting...${NC}"
fi

if curl -s http://localhost:5002/health > /dev/null; then
    echo -e "${GREEN}✅ Analytics Service: Healthy${NC}"
else
    echo -e "${YELLOW}⏳ Analytics Service: Starting...${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   🎉 Budget Insights Platform is Running!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📍 Access the application:${NC}"
echo "   Frontend:        http://localhost:3000"
echo "   Transaction API: http://localhost:5001"
echo "   Analytics API:   http://localhost:5002"
echo ""
echo -e "${BLUE}📊 Health Checks:${NC}"
echo "   curl http://localhost:5001/health"
echo "   curl http://localhost:5002/health"
echo ""
echo -e "${BLUE}📝 View Logs:${NC}"
echo "   tail -f /tmp/transaction-service.log"
echo "   tail -f /tmp/analytics-service.log"
echo "   tail -f /tmp/frontend.log"
echo ""
echo -e "${BLUE}🛑 Stop Services:${NC}"
echo "   ./stop-local.sh"
echo "   or: pkill -f 'python3 app.py' && pkill -f 'react-scripts'"
echo ""
echo -e "${YELLOW}💡 Tip: Import mock data from the frontend or use:${NC}"
echo "   curl -X POST http://localhost:5001/api/v1/transactions/import \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"user_id\": \"test_user\", \"count\": 50}'"
echo ""

# Save PIDs for stop script
echo "$TRANSACTION_PID $ANALYTICS_PID $FRONTEND_PID" > /tmp/budget-insights-pids.txt
