#!/bin/bash

# ============================================
# Cannabis Cultivation & Compliance App
# Start Script - Seeds DB, Cleans Ports, Starts App
# ============================================

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Load .env
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
DB_NAME=${DB_NAME:-cannabis_compliance}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║   🌿 Cannabis Cultivation & Compliance Platform 🌿  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Step 1: Clean up used ports ----
echo -e "${YELLOW}[1/6] Cleaning up used ports...${NC}"

cleanup_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "  ${RED}Killing processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    else
        echo -e "  ${GREEN}Port $port is free${NC}"
    fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# ---- Step 2: Check PostgreSQL ----
echo -e "\n${YELLOW}[2/6] Checking PostgreSQL...${NC}"

if command -v pg_isready &> /dev/null; then
    if pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
        echo -e "  ${GREEN}PostgreSQL is running${NC}"
    else
        echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
        else
            sudo systemctl start postgresql 2>/dev/null || true
        fi
        sleep 2
    fi
else
    echo -e "  ${YELLOW}pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# Create database if it doesn't exist
echo -e "  Creating database ${CYAN}$DB_NAME${NC} if not exists..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null | grep -q 1 || \
    PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || \
    echo -e "  ${YELLOW}Database may already exist or requires manual creation${NC}"

# ---- Step 3: Install dependencies ----
echo -e "\n${YELLOW}[3/6] Installing dependencies...${NC}"

cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    echo -e "  ${CYAN}Installing backend dependencies...${NC}"
    npm install --silent
else
    echo -e "  ${GREEN}Backend dependencies already installed${NC}"
fi

cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo -e "  ${CYAN}Installing frontend dependencies...${NC}"
    npm install --silent
else
    echo -e "  ${GREEN}Frontend dependencies already installed${NC}"
fi

# ---- Step 4: Seed database ----
echo -e "\n${YELLOW}[4/6] Seeding database with sample data...${NC}"

cd "$BACKEND_DIR"
node src/seeds/seed.js
echo -e "  ${GREEN}Database seeded successfully!${NC}"

# ---- Step 5: Start backend with auto-reload ----
echo -e "\n${YELLOW}[5/6] Starting backend server on port ${BACKEND_PORT}...${NC}"

cd "$BACKEND_DIR"
node --watch src/server.js &
BACKEND_PID=$!
echo -e "  ${GREEN}Backend started (PID: $BACKEND_PID)${NC}"

sleep 2

# ---- Step 6: Start frontend with HMR ----
echo -e "\n${YELLOW}[6/6] Starting frontend on port ${FRONTEND_PORT}...${NC}"

cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo -e "  ${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"

# ---- Done ----
echo ""
echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║          ✅ Application Started Successfully!        ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  Frontend:  http://localhost:${FRONTEND_PORT}                  ║"
echo "║  Backend:   http://localhost:${BACKEND_PORT}/api               ║"
echo "║                                                      ║"
echo "║  Demo Login:                                         ║"
echo "║    Email:    admin@cannabis.com                       ║"
echo "║    Password: password123                              ║"
echo "║                                                      ║"
echo "║  Auto-reload is enabled for code changes             ║"
echo "║  Press Ctrl+C to stop all services                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Trap Ctrl+C to clean up
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    cleanup_port $BACKEND_PORT
    cleanup_port $FRONTEND_PORT
    echo -e "${GREEN}All services stopped. Goodbye! 🌿${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
