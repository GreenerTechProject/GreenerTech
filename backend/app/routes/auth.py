from flask import Blueprint, request, jsonify
# from app.models.user import User
# from database.config import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET'])
def login():
    return jsonify({"message": "Login successful"}), 200

#     data = request.get_json()
#     user = User.query.filter_by(username=data['username']).first()
#     if user and user.password == data['password']:
#         return jsonify({"message": "Login successful"}), 200
#     return jsonify({"message": "Invalid credentials"}), 401
