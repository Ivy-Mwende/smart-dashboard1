import os
import json
import hashlib
from datetime import datetime
from functools import wraps
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database connection
def get_db_connection():
    """Establish database connection using DATABASE_URL environment variable."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    try:
        conn = psycopg2.connect(database_url)
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        raise

# Authentication helper functions
def hash_password(password):
    """Hash password using SHA256."""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    """Verify password against hash."""
    return hash_password(password) == password_hash

def verify_token(f):
    """Decorator to verify authentication token."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401
        
        # Extract username from token (simple token format: username:hash)
        try:
            username, password_hash = token.split(':')
        except ValueError:
            return jsonify({'error': 'Invalid token format'}), 401
        
        # Verify user exists with this hash
        try:
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT id FROM users WHERE username = %s AND password_hash = %s', (username, password_hash))
            user = cur.fetchone()
            cur.close()
            conn.close()
            
            if not user:
                return jsonify({'error': 'Invalid credentials'}), 401
        except psycopg2.Error as e:
            return jsonify({'error': 'Database error', 'details': str(e)}), 500
        
        return f(*args, **kwargs)
    
    return decorated_function

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    username = data.get('username').strip()
    password = data.get('password')
    
    if len(username) < 3 or len(password) < 6:
        return jsonify({'error': 'Username must be at least 3 characters and password at least 6 characters'}), 400
    
    password_hash = hash_password(password)
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO users (username, password_hash) VALUES (%s, %s)',
            (username, password_hash)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'message': 'User registered successfully', 'token': f'{username}:{password_hash}'}), 201
    except psycopg2.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 409
    except psycopg2.Error as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate user and return token."""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    username = data.get('username').strip()
    password = data.get('password')
    password_hash = hash_password(password)
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT id, password_hash FROM users WHERE username = %s', (username,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user or not verify_password(password, user['password_hash']):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        token = f'{username}:{user["password_hash"]}'
        return jsonify({'message': 'Login successful', 'token': token}), 200
    except psycopg2.Error as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

@app.route('/api/expenses', methods=['POST'])
@verify_token
def add_expense():
    """Add a new expense."""
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('amount'):
        return jsonify({'error': 'Name and amount required'}), 400
    
    name = data.get('name').strip()
    try:
        amount = float(data.get('amount'))
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except ValueError:
        return jsonify({'error': 'Amount must be a valid number'}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'INSERT INTO expenses (name, amount) VALUES (%s, %s) RETURNING id, name, amount, created_at',
            (name, amount)
        )
        expense = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'message': 'Expense added successfully',
            'expense': {
                'id': expense['id'],
                'name': expense['name'],
                'amount': float(expense['amount']),
                'created_at': expense['created_at'].isoformat()
            }
        }), 201
    except psycopg2.Error as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

@app.route('/api/income', methods=['POST'])
@verify_token
def add_income():
    """Add a new income source."""
    data = request.get_json()
    
    if not data or not data.get('source') or not data.get('amount'):
        return jsonify({'error': 'Source and amount required'}), 400
    
    source = data.get('source').strip()
    try:
        amount = float(data.get('amount'))
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except ValueError:
        return jsonify({'error': 'Amount must be a valid number'}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'INSERT INTO income (source, amount) VALUES (%s, %s) RETURNING id, source, amount, created_at',
            (source, amount)
        )
        income = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'message': 'Income added successfully',
            'income': {
                'id': income['id'],
                'source': income['source'],
                'amount': float(income['amount']),
                'created_at': income['created_at'].isoformat()
            }
        }), 201
    except psycopg2.Error as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

@app.route('/api/summary', methods=['GET'])
@verify_token
def get_summary():
    """Get financial summary with totals and balance."""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get total expenses
        cur.execute('SELECT COALESCE(SUM(amount), 0) as total FROM expenses')
        total_expenses = float(cur.fetchone()['total'])
        
        # Get total income
        cur.execute('SELECT COALESCE(SUM(amount), 0) as total FROM income')
        total_income = float(cur.fetchone()['total'])
        
        # Get all expenses and income for details
        cur.execute('SELECT id, name as label, amount, created_at FROM expenses ORDER BY created_at DESC')
        expenses = cur.fetchall()
        
        cur.execute('SELECT id, source as label, amount, created_at FROM income ORDER BY created_at DESC')
        income = cur.fetchall()
        
        # Format response
        expenses_list = [
            {
                'id': e['id'],
                'label': e['label'],
                'amount': float(e['amount']),
                'created_at': e['created_at'].isoformat()
            } for e in expenses
        ]
        
        income_list = [
            {
                'id': i['id'],
                'label': i['label'],
                'amount': float(i['amount']),
                'created_at': i['created_at'].isoformat()
            } for i in income
        ]
        
        cur.close()
        conn.close()
        
        balance = total_income - total_expenses
        
        return jsonify({
            'total_income': total_income,
            'total_expenses': total_expenses,
            'balance': balance,
            'expenses': expenses_list,
            'income': income_list
        }), 200
    except psycopg2.Error as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

@app.route('/api/expenses', methods=['GET'])
@verify_token
def get_expenses():
    """Get all expenses."""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT id, name, amount, created_at FROM expenses ORDER BY created_at DESC')
        expenses = cur.fetchall()
        cur.close()
        conn.close()
        
        expenses_list = [
            {
                'id': e['id'],
                'name': e['name'],
                'amount': float(e['amount']),
                'created_at': e['created_at'].isoformat()
            } for e in expenses
        ]
        
        return jsonify({'expenses': expenses_list}), 200
    except psycopg2.Error as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

@app.route('/api/income', methods=['GET'])
@verify_token
def get_income():
    """Get all income sources."""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT id, source, amount, created_at FROM income ORDER BY created_at DESC')
        income = cur.fetchall()
        cur.close()
        conn.close()
        
        income_list = [
            {
                'id': i['id'],
                'source': i['source'],
                'amount': float(i['amount']),
                'created_at': i['created_at'].isoformat()
            } for i in income
        ]
        
        return jsonify({'income': income_list}), 200
    except psycopg2.Error as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@verify_token
def delete_expense(expense_id):
    """Delete an expense."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM expenses WHERE id = %s', (expense_id,))
        
        if cur.rowcount == 0:
            return jsonify({'error': 'Expense not found'}), 404
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'message': 'Expense deleted successfully'}), 200
    except psycopg2.Error as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

@app.route('/api/income/<int:income_id>', methods=['DELETE'])
@verify_token
def delete_income(income_id):
    """Delete an income entry."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM income WHERE id = %s', (income_id,))
        
        if cur.rowcount == 0:
            return jsonify({'error': 'Income entry not found'}), 404
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'message': 'Income deleted successfully'}), 200
    except psycopg2.Error as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for deployment services."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT 1')
        cur.close()
        conn.close()
        return jsonify({'status': 'healthy'}), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
