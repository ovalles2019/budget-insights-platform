"""
Prometheus metrics for analytics service
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

anomalies_detected_total = Counter(
    'anomalies_detected_total',
    'Total anomalies detected',
    ['severity']
)

analytics_processing_duration_seconds = Histogram(
    'analytics_processing_duration_seconds',
    'Analytics processing duration in seconds',
    ['analytics_type']
)

def get_metrics():
    """Return Prometheus metrics"""
    return Response(generate_latest(), mimetype='text/plain')
