import jwt
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from app.models.user import User
from database.config import db
from app.utils.security import token_required, token_unrequired, generate_token, role_required
from app.utils.send_email import send_verification_email
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.entreprise import Entreprise  # Make sure to import the model
from datetime import datetime
import os


# from werkzeug.security import generate_password_hash, check_password_hash

# === REGISTER ===
@token_unrequired
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already registered"}), 409

    new_user = User(
        name=data['name'],
        email=data['email'],
        password=generate_password_hash(data['password']),
        role="directeur",
        director_valide = True     # Validé par directeur
        #role=data.get('role', 'user')
    )
    db.session.add(new_user)
    db.session.commit()
    new_user.verification_token = generate_token(new_user.id)
    db.session.commit()
   #token = generate_token(new_user.id)

    # Envoi de l'email de vérification
    send_verification_email(new_user)
    return jsonify({
        "message": "User registered successfully. Please check your email to verify your account.",
    }), 201



# === LOGIN ===
@token_unrequired
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and check_password_hash(user.password, data['password']):
        if not user.email_valide:
            return jsonify({"message": "Email not verified. Please check your email."}), 403
        token = generate_token(user.id)
        return jsonify ({
            "user" : user.to_dict(),
            "token": token, 
            "role": user.role
        }), 200

    return jsonify({"message": "Invalid credentials"}), 401

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
    current_user.birthday = data.get('birthday', current_user.birthday)
    current_user.telephone = data.get('telephone', current_user.telephone)
    current_user.cin = data.get('cin', current_user.cin)
    current_user.id_assigned = data.get('id_assigned', current_user.id_assigned)
    current_user.is_connected = data.get('is_connected', current_user.is_connected)
    current_user.director_valide = data.get('director_valide', current_user.director_valide)
    current_user.email_valide = data.get('email_valide', current_user.email_valide)
    current_user.verification_token = data.get('verification_token', current_user.verification_token)

    db.session.commit()
    return jsonify({"message": "User updated successfully"}), 200



# === GET USER ===
@token_required
def get_user(current_user):
    user_data={
        "id":current_user.id,
        "name":current_user.name,
        "email":current_user.email,
        "role":current_user.role,
        "birthday":current_user.birthday.isoformat() if current_user.birthday else None,
        "created_at":current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at":current_user.updated_at.isoformat() if current_user.updated_at else None,
        "id_assigned":current_user.id_assigned,
        "is_connected":current_user.is_connected,
        "director_valide":current_user.director_valide,
        "email_valide":current_user.email_valide
    }
    return jsonify(user_data),200

# # creat fonction pour recuperer tous les techniciens et techniciens superieur (GET)
# @token_required
# @role_required('directeur')
# def get_all_technicians():
#     techniciens = User.query.filter(User.role.in_(["technicien", "technicien_superieur"])).all()
#     techniciens_data = [
#         {
#             "id": tech.id,
#             "name": tech.name,
#             "email": tech.email,
#             "role": tech.role,
#             "birthday": tech.birthday.strftime('%Y-%m-%d') if tech.birthday else None,
#             "id_assigned": tech.id_assigned,
#             "director_valide": tech.director_valide,
#             "email_valide": tech.email_valide
#         } for tech in techniciens
#     ]
#     return jsonify(techniciens_data), 200


#creation d'un technicien par le directeur
# # === CREATE TECHNICIEN ===
@token_required
@role_required('directeur')
def create_technicien(current_user):
    data = request.get_json()
    email = data.get('email')
    role = data.get('role')

    if role not in ["technicien", "technicien supérieur"]:
        return jsonify({"message": "Rôle invalide. Choisir 'technicien' ou 'technicien supérieur'"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email déjà utilisé"}), 409

    new_user = User(
        name = data.get('fullName'),
        email =email,
        role=role,
        id_assigned=current_user.id,
        director_valide=True,
        email_valide=False
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Technicien préinscrit. En attente de complétion de compte."}), 201

# # === CHECK EMAIL ===
# @token_unrequired
# def check_email():
#     email = request.args.get('email')

#     if not email:
#         return jsonify({"error": "Email requis"}), 400

#     user = User.query.filter_by(email=email).first()

#     if user:
#         return jsonify({
#             "exists": True,
#             "user": {
#                 "email": user.email,
#                 "role": user.role,
#                 "id": user.id,
#                 "id_assigned": user.id_assigned,
#                 "birthday": user.birthday.strftime('%Y-%m-%d') if user.birthday else None
#             }
#         }), 200
#     else:
#         return jsonify({"exists": False}), 200


@token_unrequired
def get_technicien():
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Email requis"}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404
    if user.password:
        return jsonify({"error": "Compte deja existe"}), 404
    
      # Safe handling of assigned director and company
    company_name = None
    if user.id_assigned:
        director = User.query.get(user.id_assigned)
        if director:
            company = Entreprise.query.filter_by(id_user=director.id).first()
            if company:
                company_name = company.nom
    
    
    director = User.query.get(user.id_assigned) if user.id_assigned else None
    company = Entreprise.query.filter_by(id_user=director.id).first() if director else None
    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role, 
        "id_assigned": user.id_assigned,
        "company_name": company_name
    }
    return jsonify(user_data), 200



def verify_email():
    token = request.args.get('token')

    if not token:
        return jsonify({"error": "Token manquant"}), 400

    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload.get('user_id')

        if not user_id:
            return jsonify({"error": "Token invalide (pas d'identifiant)"}), 400

        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        if user.email_valide:
            return jsonify({"message": "Email déjà vérifié."}), 200

        user.email_valide = True
        user.verification_token = None
        db.session.commit()

        return jsonify({"message": "Email vérifié avec succès."}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Le token a expiré."}), 400
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token invalide."}), 400
    
@token_unrequired
def register_technicien():
    try:
        data = request.get_json()

        required_fields = ['email', 'name', 'password', 'role']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Email, nom, mot de passe et rôle sont requis"}), 400

        email = data['email']
        name = data['name']
        password = generate_password_hash(data['password']),
        role = data['role']

        if role not in ["technicien", "technicien supérieur"]:
            return jsonify({"error": "Rôle invalide"}), 400

        existing_user = User.query.filter_by(email=email).first()

        if existing_user:
            if existing_user.email_valide:
                return jsonify({"error": "Un compte avec cet email existe déjà"}), 400

            existing_user.name = name
            existing_user.password = password
            existing_user.role = role

            if 'birthday' in data and data['birthday']:
                try:
                    existing_user.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({"error": "Format de date invalide (attendu : YYYY-MM-DD)"}), 400

            existing_user.telephone = data.get('telephone')
            existing_user.cin = data.get('cin')

            db.session.commit()
            existing_user.verification_token = generate_token(existing_user.id)
            db.session.commit()

            send_verification_email(existing_user)
            return jsonify({"success": True, "message": "Compte technicien complété."}), 200

        new_user = User(
            email=email,
            name=name,
            password=password,
            role=role,
            email_valide=False,
            director_valide=False,
            is_connected=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            telephone=data.get('telephone'),
            cin=data.get('cin'),
            id_assigned=data.get('id_assigned')
        )

        if 'birthday' in data and data['birthday']:
            try:
                new_user.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Format de date invalide (attendu : YYYY-MM-DD)"}), 400

        db.session.add(new_user)
        db.session.commit()

        new_user.verification_token = generate_token(new_user.id)
        db.session.commit()

        send_verification_email(new_user)

        return jsonify({
            "success": True,
            "message": "Compte créé avec succès. Veuillez vérifier votre email.",
            "user": new_user.to_dict()
        }), 201

    except Exception as e:
        print("Erreur dans register_technicien:", str(e))
        return jsonify({"error": "Erreur interne du serveur"}), 500


# valider  le compte du technicien par le directeur
@token_required
@role_required('directeur')
def validate_technicien(current_user):
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"error": "ID utilisateur requis"}), 400

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404

    if user.director_valide:
        return jsonify({"message": "Compte déjà validé par le directeur."}), 200

    user.director_valide = True
    db.session.commit()

    return jsonify({"message": "Compte technicien validé avec succès."}), 200

# def verify_email(token):
#     user = User.query.filter_by(verification_token=token).first()
#     if not user:
#         return jsonify({"error": "Token invalide ou expiré."}), 400

#     user.email_valide = True
#     user.verification_token = None
#     db.session.commit()
#     return jsonify({"message": "Email vérifié avec succès. En attente de validation du directeur."}), 200


# @token_required
# @role_required("directeur")
# def create_technicien(current_user):
#     data = request.get_json()
#     email = data.get('email')
#     role = data.get('role')
#     id_assigned=data.get('id_assigned')

#     if role not in ["technicien", "technicien_superieur"]:
#         return jsonify({"message": "Rôle invalide. Choisir 'technicien' ou 'technicien_superieur'"}), 400

#     if User.query.filter_by(email=email).first():
#         return jsonify({"message": "Email déjà utilisé"}), 409

#     new_user = User(
#         name=data.get('name'),
#         email=email,
#         password=data.get('password'),  
#         role=role,
#         id_assigned=id_assigned
#     )
#     # hashed_password = generate_password_hash(data.get('password'), method='pbkdf2:sha256', salt_length=16)

#     # new_user = User(
#     #     name=data.get('name'),
#     #     email=email,
#     #     password=hashed_password,  # mot de passe haché
#     #     role=role
#     # )
#     db.session.add(new_user)
#     db.session.commit()

#     #return jsonify(new_user.to_dict()), 201
#     return jsonify({"message": f"{role.capitalize()} créé avec succès", "id": new_user.id}), 201

