import jwt
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from app.models.user import User
from database.config import db
#from functools import wraps
from app.utils.security import token_required, token_unrequired, generate_token, role_required

# from werkzeug.security import generate_password_hash, check_password_hash


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
@token_unrequired
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and user.password == data['password']:
        token = generate_token(user.id)
        return jsonify({"token": token}), 200

    return jsonify({"message": "Invalid credentials"}), 401

# === REGISTER ===
@token_unrequired
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already registered"}), 409

    new_user = User(
        name=data['name'],
        email=data['email'],
        password=data['password'],  # À chiffrer dans un vrai projet
        role="directeur"
        #role=data.get('role', 'user')
    )
    db.session.add(new_user)
    db.session.commit()
    
    token = generate_token(new_user.id)
    return jsonify({"message": "User registered successfully", "token": token}), 201

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


@token_required
@role_required("directeur")
def create_technicien(current_user):
    data = request.get_json()
    email = data.get('email')
    role = data.get('role')

    if role not in ["technicien", "technicien_superieur"]:
        return jsonify({"message": "Rôle invalide. Choisir 'technicien' ou 'technicien_superieur'"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email déjà utilisé"}), 409

    new_user = User(
        name=data.get('name'),
        email=email,
        password=data.get('password'),  
        role=role
    )
    # hashed_password = generate_password_hash(data.get('password'), method='pbkdf2:sha256', salt_length=16)

    # new_user = User(
    #     name=data.get('name'),
    #     email=email,
    #     password=hashed_password,  # mot de passe haché
    #     role=role
    # )
    db.session.add(new_user)
    db.session.commit()

    return jsonify(new_user.to_dict()), 201

