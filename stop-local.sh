#!/bin/bash

# Stop Local Development Script
# Budget Insights Platform

echo "🛑 Stopping Budget Insights Platform..."

# Stop services
pkill -f "python3 app.py" 2>/dev/null && echo "✅ Stopped Python services" || echo "No Python services running"
pkill -f "react-scripts start" 2>/dev/null && echo "✅ Stopped Frontend" || echo "No frontend running"

# Clean up PID file
rm -f /tmp/budget-insights-pids.txt

echo ""
echo "✅ All services stopped!"
