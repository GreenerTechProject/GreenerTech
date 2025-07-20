import jwt
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from app.models.user import User
from database.config import db
#from functools import wraps
from app.utils.security import token_required, generate_token, role_required

# === AUTH DECORATOR ===
# def token_required(f):
#     @wraps(f)
#     def decorated(*args, **kwargs):
#         token = None
#         if 'Authorization' in request.headers:
#             token = request.headers['Authorization'].split(" ")[1]

#         if not token:
#             return jsonify({"message": "Token is missing!"}), 401

#         try:
#             data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
#             current_user = User.query.get(data['user_id'])
#             if not current_user:
#                 return jsonify({"message": "User not found"}), 401
#         except jwt.ExpiredSignatureError:
#             return jsonify({"message": "Token expired"}), 401
#         except jwt.InvalidTokenError:
#             return jsonify({"message": "Invalid token"}), 401

#         return f(current_user, *args, **kwargs)
#     return decorated

# === LOGIN ===
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and user.password == data['password']:
        token = generate_token(user.id)
        return jsonify({"token": token}), 200

    return jsonify({"message": "Invalid credentials"}), 401

# === REGISTER ===
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already registered"}), 409

    new_user = User(
        name=data['name'],
        email=data['email'],
        password=data['password'],  # À chiffrer dans un vrai projet
        role=data.get('role', 'user')
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

# === DELETE USER ===
@token_required
def delete_user(current_user):
    db.session.delete(current_user)
    db.session.commit()
    return jsonify({"message": f"User with ID {current_user.id} deleted successfully"}), 200

# === UPDATE USER ===
@token_required
def update_user(current_user):
    data = request.get_json()

    current_user.name = data.get('name', current_user.name)
    current_user.email = data.get('email', current_user.email)
    current_user.password = data.get('password', current_user.password)
    current_user.role = data.get('role', current_user.role)

    db.session.commit()
    return jsonify({"message": "User updated successfully"}), 200

# === GET USER ===

@token_required
@role_required(['directeur']) 
def get_user(current_user):
    user_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat(),
        "updated_at": current_user.updated_at.isoformat()
    }
    return jsonify(user_data), 200
