# Portfolio demo: React UI + transaction + analytics microservices behind nginx
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
ENV REACT_APP_DEMO_MODE=true
RUN npm run build

FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends nginx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY services/transaction-service/requirements.txt /tmp/txn-req.txt
COPY services/analytics-service/requirements.txt /tmp/analytics-req.txt
RUN pip install --no-cache-dir -r /tmp/txn-req.txt -r /tmp/analytics-req.txt

COPY services/transaction-service/app.py services/transaction-service/metrics.py /app/transaction/
COPY services/analytics-service/app.py services/analytics-service/metrics.py /app/analytics/

COPY deploy/render/nginx.conf /etc/nginx/templates/default.conf
COPY deploy/render/start.sh /start.sh
RUN chmod +x /start.sh

COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html

ENV BUDGET_INSIGHTS_DEMO=1 \
    TRANSACTION_SERVICE_URL=http://127.0.0.1:5001

EXPOSE 10000

CMD ["/start.sh"]
