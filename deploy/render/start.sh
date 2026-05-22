#!/bin/sh
set -e

PORT="${PORT:-10000}"
export TRANSACTION_SERVICE_URL=http://127.0.0.1:5001

cd /app/transaction
gunicorn --bind 127.0.0.1:5001 --workers 2 --timeout 120 app:app &
TXN_PID=$!

cd /app/analytics
gunicorn --bind 127.0.0.1:5002 --workers 2 --timeout 120 app:app &
AN_PID=$!

echo "Waiting for transaction-service..."
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
    if python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5001/health', timeout=2)" 2>/dev/null; then
        break
    fi
    sleep 1
done

if [ "${BUDGET_INSIGHTS_DEMO}" = "1" ]; then
    echo "Seeding demo transactions..."
    python3 -c "
import json, urllib.request
req = urllib.request.Request(
    'http://127.0.0.1:5001/api/v1/transactions/import',
    data=json.dumps({'user_id': 'default_user', 'count': 50}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST',
)
urllib.request.urlopen(req, timeout=30)
" || echo "Seed skipped (may already exist)"
fi

sed "s/listen 10000/listen ${PORT}/" /etc/nginx/templates/default.conf > /etc/nginx/conf.d/default.conf

nginx -g 'daemon off;' &
NG_PID=$!

trap 'kill $TXN_PID $AN_PID $NG_PID 2>/dev/null' TERM INT
wait $NG_PID
