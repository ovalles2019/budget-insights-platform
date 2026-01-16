"""
Analytics Service - Anomaly detection, budget calculations, and insights
Microservice architecture for Capital One-style portfolio project
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import statistics
import requests
import os
from metrics import http_requests_total, http_request_duration_seconds, anomalies_detected_total, get_metrics
from functools import wraps
import time

app = Flask(__name__)
CORS(app)

# Metrics decorator
def track_metrics(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        try:
            response = f(*args, **kwargs)
            status_code = response[1] if isinstance(response, tuple) else 200
            http_requests_total.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown',
                status=status_code
            ).inc()
            http_request_duration_seconds.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown'
            ).observe(time.time() - start_time)
            return response
        except Exception as e:
            http_requests_total.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown',
                status=500
            ).inc()
            raise
    return decorated_function

# Configuration
TRANSACTION_SERVICE_URL = os.environ.get(
    'TRANSACTION_SERVICE_URL',
    'http://transaction-service:5001'
)

def calculate_statistics(amounts):
    """Calculate statistical measures"""
    if not amounts:
        return {}
    
    return {
        'mean': statistics.mean(amounts),
        'median': statistics.median(amounts),
        'stdev': statistics.stdev(amounts) if len(amounts) > 1 else 0,
        'min': min(amounts),
        'max': max(amounts)
    }

def detect_anomalies(transactions):
    """Detect anomalous transactions using statistical methods"""
    if len(transactions) < 5:
        return []
    
    amounts = [abs(t['amount']) for t in transactions]
    mean = statistics.mean(amounts)
    stdev = statistics.stdev(amounts) if len(amounts) > 1 else 0
    
    anomalies = []
    threshold = mean + (2 * stdev)  # 2 standard deviations
    
    for transaction in transactions:
        amount = abs(transaction['amount'])
        if amount > threshold:
            severity = 'high' if amount > mean + (3 * stdev) else 'medium'
            anomalies.append({
                'transaction_id': transaction['id'],
                'description': transaction['description'],
                'amount': transaction['amount'],
                'date': transaction['date'],
                'reason': f'Amount ({abs(transaction["amount"])}) exceeds threshold ({threshold:.2f})',
                'severity': severity
            })
            # Track anomaly metric
            anomalies_detected_total.labels(severity=severity).inc()
    
    return anomalies

def calculate_budget_status(transactions, budget_limits):
    """Calculate budget status for each category"""
    category_totals = {}
    
    for transaction in transactions:
        category = transaction.get('category', 'Other')
        amount = abs(transaction.get('amount', 0))
        category_totals[category] = category_totals.get(category, 0) + amount
    
    budget_status = []
    for category, limit in budget_limits.items():
        spent = category_totals.get(category, 0)
        percentage = (spent / limit * 100) if limit > 0 else 0
        remaining = limit - spent
        
        status = {
            'category': category,
            'budget_limit': limit,
            'spent': round(spent, 2),
            'remaining': round(remaining, 2),
            'percentage_used': round(percentage, 2),
            'status': 'over' if spent > limit else 'warning' if percentage > 80 else 'ok'
        }
        budget_status.append(status)
    
    return budget_status

def generate_insights(transactions):
    """Generate spending insights"""
    if not transactions:
        return []
    
    insights = []
    
    # Top spending category
    category_totals = {}
    for transaction in transactions:
        category = transaction.get('category', 'Other')
        amount = abs(transaction.get('amount', 0))
        category_totals[category] = category_totals.get(category, 0) + amount
    
    if category_totals:
        top_category = max(category_totals.items(), key=lambda x: x[1])
        insights.append({
            'type': 'top_category',
            'message': f'Your top spending category is {top_category[0]} with ${top_category[1]:.2f}',
            'category': top_category[0],
            'amount': top_category[1]
        })
    
    # Monthly trend
    monthly_totals = {}
    for transaction in transactions:
        date = datetime.fromisoformat(transaction['date'].replace('Z', '+00:00'))
        month_key = date.strftime('%Y-%m')
        amount = abs(transaction.get('amount', 0))
        monthly_totals[month_key] = monthly_totals.get(month_key, 0) + amount
    
    if len(monthly_totals) >= 2:
        months = sorted(monthly_totals.keys())
        recent_month = monthly_totals[months[-1]]
        previous_month = monthly_totals[months[-2]]
        change = ((recent_month - previous_month) / previous_month * 100) if previous_month > 0 else 0
        
        insights.append({
            'type': 'trend',
            'message': f'Spending changed by {change:+.1f}% compared to last month',
            'change_percentage': round(change, 2),
            'current_month': recent_month,
            'previous_month': previous_month
        })
    
    # Average transaction size
    amounts = [abs(t['amount']) for t in transactions]
    avg_transaction = statistics.mean(amounts)
    insights.append({
        'type': 'average',
        'message': f'Average transaction size is ${avg_transaction:.2f}',
        'average': round(avg_transaction, 2)
    })
    
    return insights

@app.route('/metrics', methods=['GET'])
def metrics():
    """Prometheus metrics endpoint"""
    return get_metrics()

@app.route('/health', methods=['GET'])
@track_metrics
def health_check():
    """Health check endpoint for Kubernetes"""
    return jsonify({
        'status': 'healthy',
        'service': 'analytics-service',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/v1/analytics/anomalies', methods=['GET'])
@track_metrics
def get_anomalies():
    """Detect anomalies in transactions"""
    user_id = request.args.get('user_id', 'default_user')
    
    try:
        # Fetch transactions from transaction service
        response = requests.get(
            f'{TRANSACTION_SERVICE_URL}/api/v1/transactions',
            params={'user_id': user_id},
            timeout=5
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch transactions'}), 500
        
        transactions = response.json().get('transactions', [])
        anomalies = detect_anomalies(transactions)
        
        return jsonify({
            'anomalies': anomalies,
            'count': len(anomalies)
        }), 200
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/analytics/budget', methods=['POST'])
@track_metrics
def get_budget_status():
    """Calculate budget status"""
    data = request.json
    user_id = data.get('user_id', 'default_user')
    budget_limits = data.get('budget_limits', {})
    
    try:
        # Fetch transactions from transaction service
        response = requests.get(
            f'{TRANSACTION_SERVICE_URL}/api/v1/transactions',
            params={'user_id': user_id},
            timeout=5
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch transactions'}), 500
        
        transactions = response.json().get('transactions', [])
        budget_status = calculate_budget_status(transactions, budget_limits)
        
        return jsonify({
            'budget_status': budget_status,
            'user_id': user_id
        }), 200
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/analytics/insights', methods=['GET'])
@track_metrics
def get_insights():
    """Generate spending insights"""
    user_id = request.args.get('user_id', 'default_user')
    
    try:
        # Fetch transactions from transaction service
        response = requests.get(
            f'{TRANSACTION_SERVICE_URL}/api/v1/transactions',
            params={'user_id': user_id},
            timeout=5
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch transactions'}), 500
        
        transactions = response.json().get('transactions', [])
        insights = generate_insights(transactions)
        
        return jsonify({
            'insights': insights,
            'count': len(insights)
        }), 200
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/analytics/summary', methods=['GET'])
@track_metrics
def get_summary():
    """Get comprehensive analytics summary"""
    user_id = request.args.get('user_id', 'default_user')
    
    try:
        # Fetch transactions from transaction service
        response = requests.get(
            f'{TRANSACTION_SERVICE_URL}/api/v1/transactions',
            params={'user_id': user_id},
            timeout=5
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch transactions'}), 500
        
        transactions = response.json().get('transactions', [])
        
        if not transactions:
            return jsonify({
                'summary': {
                    'total_transactions': 0,
                    'total_spent': 0,
                    'anomalies': [],
                    'insights': []
                }
            }), 200
        
        amounts = [abs(t['amount']) for t in transactions]
        anomalies = detect_anomalies(transactions)
        insights = generate_insights(transactions)
        
        summary = {
            'total_transactions': len(transactions),
            'total_spent': round(sum(amounts), 2),
            'statistics': calculate_statistics(amounts),
            'anomalies_count': len(anomalies),
            'anomalies': anomalies[:5],  # Top 5
            'insights': insights
        }
        
        return jsonify({'summary': summary}), 200
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=True)
