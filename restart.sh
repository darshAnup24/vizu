#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.logs"
mkdir -p "$LOG_DIR"

stop_port() {
    local port="$1"
    local pids
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
        echo "Stopping process(es) on port $port: $pids"
        kill $pids 2>/dev/null || true
    fi
}

stop_port 8000
stop_port 3000

# Stop project processes that may not currently own a listening socket.
pkill -f "$ROOT_DIR/frontend/node_modules/.bin/next dev" 2>/dev/null || true
pkill -f "python -m uvicorn main:app" 2>/dev/null || true

# Remove any remaining listeners before starting fixed-port services.
stop_port 8000
stop_port 3000
rm -rf "$ROOT_DIR/frontend/.next"

(
    cd "$ROOT_DIR/backend"
    nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$LOG_DIR/backend.pid"
)

(
    cd "$ROOT_DIR/frontend"
    nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$LOG_DIR/frontend.pid"
)

echo "Backend starting at http://localhost:8000"
echo "Frontend starting at http://localhost:3000"
echo "Logs: $LOG_DIR/backend.log and $LOG_DIR/frontend.log"
