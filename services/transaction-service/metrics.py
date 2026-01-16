"""
Prometheus metrics for transaction service
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from flask import Response

# Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

transactions_total = Counter(
    'transactions_total',
    'Total transactions processed',
    ['category', 'type']
)

active_connections = Gauge(
    'active_connections',
    'Number of active connections'
)

def get_metrics():
    """Return Prometheus metrics"""
    return Response(generate_latest(), mimetype='text/plain')
