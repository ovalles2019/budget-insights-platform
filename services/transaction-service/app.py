"""
Transaction Service - REST API for managing financial transactions
Microservice architecture for Capital One-style portfolio project
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import random
import uuid
import os
from metrics import http_requests_total, http_request_duration_seconds, transactions_total, get_metrics
from prometheus_client import CONTENT_TYPE_LATEST
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

# In-memory storage (replace with database in production)
transactions = []
categories = {
    'Food & Dining': ['restaurant', 'grocery', 'coffee', 'fast food', 'delivery'],
    'Shopping': ['amazon', 'target', 'walmart', 'clothing', 'electronics'],
    'Transportation': ['gas', 'uber', 'lyft', 'parking', 'toll'],
    'Bills & Utilities': ['electric', 'water', 'internet', 'phone', 'rent'],
    'Entertainment': ['netflix', 'spotify', 'movie', 'concert', 'game'],
    'Healthcare': ['pharmacy', 'doctor', 'hospital', 'insurance'],
    'Travel': ['hotel', 'flight', 'airbnb', 'rental car'],
    'Other': []
}

def categorize_transaction(description, amount):
    """Categorize transaction based on description"""
    description_lower = description.lower()
    for category, keywords in categories.items():
        if category == 'Other':
            continue
        for keyword in keywords:
            if keyword in description_lower:
                return category
    return 'Other'

def generate_mock_transactions(user_id, count=50):
    """Generate mock transaction data"""
    merchants = [
        'Amazon', 'Target', 'Walmart', 'Starbucks', 'McDonald\'s',
        'Shell Gas Station', 'Uber', 'Netflix', 'Spotify', 'Whole Foods',
        'CVS Pharmacy', 'AT&T', 'Electric Company', 'Airbnb', 'Delta Airlines'
    ]
    
    mock_transactions = []
    base_date = datetime.now()
    
    for i in range(count):
        days_ago = random.randint(0, 90)
        transaction_date = base_date - timedelta(days=days_ago)
        merchant = random.choice(merchants)
        amount = round(random.uniform(-500, -5), 2)  # Negative for expenses
        
        transaction = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'date': transaction_date.isoformat(),
            'description': merchant,
            'amount': amount,
            'category': categorize_transaction(merchant, amount),
            'type': 'expense',
            'created_at': datetime.now().isoformat()
        }
        mock_transactions.append(transaction)
    
    return mock_transactions

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
        'service': 'transaction-service',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/v1/transactions', methods=['GET'])
@track_metrics
def get_transactions():
    """Get all transactions for a user"""
    user_id = request.args.get('user_id', 'default_user')
    user_transactions = [t for t in transactions if t.get('user_id') == user_id]
    
    return jsonify({
        'transactions': user_transactions,
        'count': len(user_transactions)
    }), 200

@app.route('/api/v1/transactions', methods=['POST'])
@track_metrics
def create_transaction():
    """Create a new transaction"""
    data = request.json
    
    transaction = {
        'id': str(uuid.uuid4()),
        'user_id': data.get('user_id', 'default_user'),
        'date': data.get('date', datetime.now().isoformat()),
        'description': data.get('description', ''),
        'amount': float(data.get('amount', 0)),
        'category': categorize_transaction(
            data.get('description', ''),
            data.get('amount', 0)
        ),
        'type': data.get('type', 'expense'),
        'created_at': datetime.now().isoformat()
    }
    
    transactions.append(transaction)
    transactions_total.labels(
        category=transaction['category'],
        type=transaction['type']
    ).inc()
    return jsonify(transaction), 201

@app.route('/api/v1/transactions/import', methods=['POST'])
@track_metrics
def import_transactions():
    """Import mock transactions for a user"""
    data = request.json
    user_id = data.get('user_id', 'default_user')
    count = data.get('count', 50)
    
    mock_data = generate_mock_transactions(user_id, count)
    transactions.extend(mock_data)
    
    return jsonify({
        'message': f'Imported {count} transactions',
        'transactions': mock_data
    }), 201

@app.route('/api/v1/transactions/<transaction_id>', methods=['GET'])
@track_metrics
def get_transaction(transaction_id):
    """Get a specific transaction"""
    transaction = next((t for t in transactions if t['id'] == transaction_id), None)
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    return jsonify(transaction), 200

@app.route('/api/v1/transactions/<transaction_id>', methods=['DELETE'])
@track_metrics
def delete_transaction(transaction_id):
    """Delete a transaction"""
    global transactions
    transactions = [t for t in transactions if t['id'] != transaction_id]
    
    return jsonify({'message': 'Transaction deleted'}), 200

@app.route('/api/v1/categories', methods=['GET'])
@track_metrics
def get_categories():
    """Get all available categories"""
    return jsonify({
        'categories': list(categories.keys())
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
