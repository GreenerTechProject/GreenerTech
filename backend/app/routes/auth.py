from flask import Blueprint, request, jsonify
from app.models.user import User
from database.config import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and user.password == data['password']:
        return jsonify({"message": "Login successful222222222"}), 200
    return jsonify({"message": "Invalid credentials"}), 401
