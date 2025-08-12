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
from app.utils.notifications import envoyer_notification


# from werkzeug.security import generate_password_hash, check_password_hash

# === REGISTER ===
@token_unrequired
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email déjà enregistré"}), 409

    new_user = User(
        name=data['name'],
        email=data['email'],
        password=generate_password_hash(data['password']),
        role="directeur",
        directeur_valide = True     # Validé par directeur
        #role=data.get('role', 'user')
    )
    db.session.add(new_user)
    db.session.commit()
    new_user.verification_token = generate_token(new_user.id)
    db.session.commit()
    # Envoi de l'email de vérification
    send_verification_email(new_user)
    return jsonify({
        "message": "Utilisateur enregistré avec succès. Veuillez vérifier votre email pour activer votre compte.",
    }), 201



# === LOGIN ===
@token_unrequired
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and check_password_hash(user.password, data['password']):
        if not user.email_valide:
            return jsonify({"message": "Email non vérifié. Veuillez vérifier votre email."}), 403
        if user.role in ["technicien", "technicien_superieur"]:
            if not user.directeur_valide:
                return jsonify({"message": "Votre compte n'a pas encore été validé par un directeur. Veuillez contacter votre directeur pour activer votre accès."}), 403
        token = generate_token(user.id)
        return jsonify ({
            "user" : user.to_dict(),
            "token": token, 
            "role": user.role
        }), 200

    return jsonify({"message": "Identifiants invalides"}), 401

# === DELETE USER ===
@token_required
def delete_user(current_user):
    db.session.delete(current_user)
    db.session.commit()
    return jsonify({"message": f"Utilisateur avec l'ID {current_user.id} supprimé avec succès"}), 200

# === UPDATE USER ===
@token_required
def update_user(current_user):
    data = request.get_json()

    current_user.name = data.get('name', current_user.name)
    current_user.email = data.get('email', current_user.email)
    
    new_password = data.get('password')
    if new_password:
        current_user.password = generate_password_hash(new_password)
    else :
        current_user.password = current_user.password
    
    current_user.role = data.get('role', current_user.role)
    current_user.birthday = data.get('birthday', current_user.birthday)
    current_user.telephone = data.get('telephone', current_user.telephone)
    current_user.cin = data.get('cin', current_user.cin)
    current_user.id_assigned = data.get('id_assigned', current_user.id_assigned)
    current_user.setup_completed = data.get('setup_completed', current_user.setup_completed)
    current_user.directeur_valide = data.get('directeur_valide', current_user.directeur_valide)
    current_user.email_valide = data.get('email_valide', current_user.email_valide)
    current_user.verification_token = data.get('verification_token', current_user.verification_token)

    db.session.commit()
    return jsonify({"message": "Utilisateur mis à jour avec succès"}), 200



# === GET USER ===
@token_required
def get_user(current_user):
    user_data={
        "id":current_user.id,
        "name":current_user.name,
        "email":current_user.email,
        "role":current_user.role,
        "telephone":current_user.telephone,
        "birthday":current_user.birthday.isoformat() if current_user.birthday else None,
        "created_at":current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at":current_user.updated_at.isoformat() if current_user.updated_at else None,
        "id_assigned":current_user.id_assigned,
        "setup_completed":current_user.setup_completed,
        "directeur_valide":current_user.directeur_valide,
        "email_valide":current_user.email_valide,
        "id_entreprise" : current_user.id_entreprise
    }
    return jsonify(user_data),200

# creat fonction pour recuperer tous les techniciens et techniciens superieur (GET)
@token_required
@role_required('directeur')
def get_all_technicians(current_user):
    techniciens = User.query.filter(User.role.in_(["technicien", "technicien_superieur"])).all()
    techniciens_data = [
        {
            "id": tech.id,
            "name": tech.name,
            "email": tech.email,
            "role": tech.role,
            "birthday": tech.birthday.strftime('%Y-%m-%d') if tech.birthday else None,
            "id_assigned": tech.id_assigned,
            "directeur_valide": tech.directeur_valide,
            "email_valide": tech.email_valide
        } for tech in techniciens
    ]
    return jsonify(techniciens_data), 200


#creation d'un technicien par le directeur
# # === CREATE TECHNICIEN ===
@token_required
@role_required('directeur')
def create_technicien(current_user):
    data = request.get_json()
    email = data.get('email')
    role = data.get('role')
    name = data.get('fullName')
    company_id = data.get('companyId')


    if role not in ["technicien", "technicien_superieur"]:
        return jsonify({"message": "Rôle invalide. Choisir 'technicien' ou 'technicien_superieur'"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email déjà utilisé"}), 409

    # Use companyId from request instead of automatic detection
    if not company_id:
        return jsonify({"message": "ID de l'entreprise requis"}), 400
    
    # Verify the director has access to this company
    if current_user.id_entreprise != company_id:
        return jsonify({"message": "Accès non autorisé à cette entreprise"}), 403

    new_user = User(
        email=email,
        name=name,
        role=role,
        id_assigned=current_user.id,
        id_entreprise=company_id,
        directeur_valide=True,
        email_valide=False
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "Technicien préinscrit. En attente de complétion de compte.",
        "id": new_user.id
    }), 201

@token_required
@role_required('directeur', 'technicien_superieur')
def get_alltechniciens_by_company(current_user, company_id):
    """Return technicians (both roles) belonging to a given entreprise (company)."""
    print(f"[Backend] ===== get_techniciens_by_company FUNCTION CALLED =====")
    try:
        print(f"[Backend] get_techniciens_by_company called with company_id: {company_id}")
        print(f"[Backend] Company_id type: {type(company_id)}")
        print(f"[Backend] Current user: {current_user.email}, role: {current_user.role}, id_entreprise: {current_user.id_entreprise}")
        
        # Tech sup can only query their own company
        if current_user.role == 'technicien_superieur' and current_user.id_entreprise != company_id:
            print(f"[Backend] Access denied: tech_sup id_entreprise {current_user.id_entreprise} != requested {company_id}")
            return jsonify({"message": "Non autorisé"}), 403

        technicians = (
            User.query
            .filter(User.id_entreprise == company_id)
            .filter(User.role.in_(["technicien", "technicien_superieur"]))
            .all()
        )
        
        print(f"[Backend] Found {len(technicians)} technicians for company {company_id}")
        for tech in technicians:
            print(f"[Backend] Tech: {tech.email}, role: {tech.role}, id_entreprise: {tech.id_entreprise}")
        
        data = [
            {
                "id": tech.id,
                "fullName": tech.name,  # Changed from "name" to "fullName" to match frontend
                "email": tech.email,
                "role": tech.role,
                "assignedSerres": [],  # Added to match frontend expectations
            }
            for tech in technicians
        ]
        
        print(f"[Backend] Returning data: {data}")
        return jsonify({"success": True, "technicians": data}), 200
    except Exception as e:
        print(f"[Backend] Error in get_techniciens_by_company: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 400

@token_required
@role_required('directeur', 'technicien_superieur')
def get_techniciens_by_company(current_user, company_id):
    try: 
        # Tech sup can only query their own company
        if current_user.role == 'technicien_superieur' and current_user.id_entreprise != company_id:
            print(f"[Backend] Access denied: tech_sup id_entreprise {current_user.id_entreprise} != requested {company_id}")
            return jsonify({"message": "Non autorisé"}), 403

        technicians = (
            User.query
            .filter(User.id_entreprise == company_id)
            .filter(User.role.in_(["technicien"]))
            .all()
        )
        
        print(f"[Backend] Found {len(technicians)} technicians for company {company_id}")
        for tech in technicians:
            print(f"[Backend] Tech: {tech.email}, role: {tech.role}, id_entreprise: {tech.id_entreprise}")
        
        data = [
            {
                "id": tech.id,
                "fullName": tech.name,  # Changed from "name" to "fullName" to match frontend
                "email": tech.email,
                "role": tech.role,
                "assignedSerres": [],  # Added to match frontend expectations
            }
            for tech in technicians
        ]
        
        return jsonify({"success": True, "technicians": data}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

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
def get_technicien_by_email():
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
    id_entreprise = None
    if user.id_assigned:
        director = User.query.get(user.id_assigned)
        if director:
            company = Entreprise.query.filter_by(id_user=director.id).first()
            if company:
                company_name = company.nom
                id_entreprise = company.id
    
    
    director = User.query.get(user.id_assigned) if user.id_assigned else None
    company = Entreprise.query.filter_by(id_user=director.id).first() if director else None
    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role, 
        "id_assigned": user.id_assigned,
        "company_name": company_name,
        "id_entreprise": id_entreprise
    }
    print(f"[Backend] Returning user data: {user_data}")
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


        return jsonify({
            "message": "Email vérifié avec succès."
        }), 200

        # return jsonify({"message": "Email vérifié avec succès."}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Le token a expiré."}), 400
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token invalide."}), 400


def register_technicien():
    try:
        data = request.get_json()
        print(f"[Backend] Received data: {data}")

        required_fields = ['email', 'password', 'role']
        if not all(field in data for field in required_fields):
            print(f"[Backend] Missing required fields. Required: {required_fields}, Received: {list(data.keys())}")
            return jsonify({"error": "Email, mot de passe et rôle sont requis"}), 400

        if not data.get('name') and not (data.get('firstName') and data.get('lastName')):
            print(f"[Backend] Missing name fields. name: {data.get('name')}, firstName: {data.get('firstName')}, lastName: {data.get('lastName')}")
            return jsonify({"error": "Nom et prénom sont requis"}), 400

        # For pre-registered users, we can derive id_entreprise from their assigned director
        print(f"[Backend] Checking id_entreprise: {data.get('id_entreprise')}, id_assigned: {data.get('id_assigned')}")
        if not data.get('id_entreprise') and not data.get('id_assigned'):
            print(f"[Backend] Missing id_entreprise and no id_assigned. Received: {data.get('id_entreprise')}")
            return jsonify({"error": "Sélection d'entreprise requise"}), 400

        email = data.get('email')
        role = data.get('role')
        name = data.get('name') or f"{data.get('firstName', '')} {data.get('lastName', '')}".strip()
        password = generate_password_hash(data.get('password'))
        birthday = data.get('birthday') or data.get('birthDate')
        telephone = data.get('telephone')
        cin = data.get('cin')
        id_entreprise = data.get('id_entreprise')
        
        # For pre-registered users, derive id_entreprise from assigned director if not provided
        if not id_entreprise and data.get('id_assigned'):
            print(f"[Backend] No id_entreprise provided, trying to derive from id_assigned: {data.get('id_assigned')}")
            assigned_director = User.query.get(data.get('id_assigned'))
            if assigned_director and assigned_director.role == 'directeur':
                company = Entreprise.query.filter_by(id_user=assigned_director.id).first()
                if company:
                    id_entreprise = company.id
                    print(f"[Backend] Derived id_entreprise {id_entreprise} from assigned director {assigned_director.id}")
                else:
                    print(f"[Backend] No company found for director {assigned_director.id}")
            else:
                print(f"[Backend] Assigned user {data.get('id_assigned')} not found or not a director")
        else:
            print(f"[Backend] Using provided id_entreprise: {id_entreprise}")

        # Validate company exists (either provided directly or derived from assigned director)
        if id_entreprise:
            company = Entreprise.query.filter_by(id=id_entreprise).first()
            if not company:
                return jsonify({"error": "Entreprise sélectionnée introuvable"}), 404
        else:
            return jsonify({"error": "Impossible de déterminer l'entreprise. Veuillez contacter votre directeur."}), 400

        if role not in ["technicien", "technicien_superieur"]:
            return jsonify({"message": "Rôle invalide. Choisir 'technicien' ou 'technicien_superieur'"}), 400

        existing_user = User.query.filter_by(email=email).first()

        if existing_user:
            # Update User
            if not existing_user.password:
                existing_user.password = password
                existing_user.name = name
                if 'birthday' in data and data['birthday']:
                    try:
                        existing_user.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
                    except ValueError:
                        return jsonify({"error": "Format de date invalide (attendu : YYYY-MM-DD)"}), 400
                elif 'birthDate' in data and data['birthDate']:
                    try:
                        existing_user.birthday = datetime.strptime(data['birthDate'], '%Y-%m-%d').date()
                    except ValueError:
                        return jsonify({"error": "Format de date invalide (attendu : YYYY-MM-DD)"}), 400
                
                existing_user.telephone = telephone
                existing_user.cin = cin
                existing_user.role = role
                existing_user.id_entreprise = id_entreprise  # Set the company ID
                existing_user.email_valide = False
                existing_user.verification_token = generate_token(existing_user.id)
                
                db.session.commit()
                print(f"[Backend] After update - id_entreprise set to: {existing_user.id_entreprise}")
                
                send_verification_email(existing_user)
                
                return jsonify({"message": "Compte technicien complété. En attente de validation d'email."}), 200
            else:
                return jsonify({"message": "Cet email est déjà utilisé par un compte existant."}), 400

        # New user
        new_user = User(
            email=email,
            role=role,
            name=name,
            password=password,
            birthday=datetime.strptime(birthday, '%Y-%m-%d') if birthday else None,
            telephone=telephone,
            cin=cin,
            id_entreprise=id_entreprise,  # Set the company ID
            directeur_valide=False,
            email_valide=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        if 'birthday' in data and data['birthday']:
            try:
                new_user.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Format de date invalide (attendu : YYYY-MM-DD)"}), 400
        elif 'birthDate' in data and data['birthDate']:
            try:
                new_user.birthday = datetime.strptime(data['birthDate'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Format de date invalide (attendu : YYYY-MM-DD)"}), 400
        
        directeur = User.query.filter_by(role='directeur', id_entreprise=id_entreprise).first()
        if not directeur:
            return jsonify({"error": "Aucun directeur trouvé pour cette entreprise."}), 404
        elif directeur:
            envoyer_notification(
                description=f"Un nouveau technicien ({name}) a créé un compte.",
                id_user=directeur.id,
                type_notification="compte_technicien"
            )
            
        db.session.add(new_user)
        db.session.flush()  # Pour récupérer l'ID
        
        new_user.verification_token = generate_token(new_user.id)
        db.session.commit()
        
        send_verification_email(new_user)
        
        return jsonify({"message": "Compte technicien créé. Veuillez vérifier votre email pour activer votre compte. En attente de validation du directeur."}), 201

    except Exception as e:
        print("Erreur dans register_technicien:", str(e))
        return jsonify({"error": "Erreur interne du serveur"}), 500



    # if not email or not password or not name:
    #     return jsonify({"error": "Email, nom et mot de passe requis"}), 400
    
    # if role not in ["technicien", "technicien_superieur"]:
    #     return jsonify({"message": "Rôle invalide. Choisir 'technicien' ou 'technicien_superieur'"}), 400


    # existing_user = User.query.filter_by(email=email).first()
    # if existing_user:
    #     # Si l'utilisateur existe déjà et le compte com
    #     if existing_user.email_valide :
    #         return jsonify({"error": "Compte déjà existe "}), 400

    #     # Mise à jour du compte partiellement créé par le directeur
    #     existing_user.name = name
    #     existing_user.password = password
    #     existing_user.email_valide = False
    #     if birthday:
    #         try:
    #             existing_user.birthday = datetime.strptime(birthday, '%Y-%m-%d')
    #         except ValueError:
    #             return jsonify({"error": "Format de date invalide (attendu : YYYY-MM-DD)"}), 400
            
    #     existing_user.verification_token = generate_token(existing_user.id)
    #     send_verification_email(existing_user)
    #     db.session.commit()
    #     return jsonify({"message": "Compte technicien complété. En attente de validation du directeur."}), 200

    # # Création d’un nouveau compte technicien

    # new_user = User(
    #     email=email,
    #     name=name,
    #     role=role,
    #     password=password,
    #     birthday=datetime.strptime(birthday, '%Y-%m-%d') if birthday else None,
    #     directeur_valide=False,
    #     email_valide=False,
    # )

    # new_user.verification_token = generate_token(new_user.id)
    # db.session.add(new_user)
    # db.session.commit()
    # send_verification_email(new_user)
    
    # return jsonify({"message": "Compte créé , Veuillez vérifier votre email pour activer votre compte.)."}), 201


# valider  le compte du technicien par le directeur
@token_required
@role_required('directeur')
def validate_technicien(current_user, id):
    user = User.query.get(id)

    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404

    if user.directeur_valide:
        return jsonify({"message": "Compte déjà validé par le directeur."}), 200

    user.directeur_valide = True
    db.session.commit()
    # envoyer_notification(
    #     description="Votre compte a été validé par le directeur.",
    #     id_user=user.id,
    #     type_notification="compte_valide"
    # )

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

# Get pending technicians for affiliation management (directeur_valide = false)
@token_required
@role_required('directeur')
def get_pending_technicians_by_company(current_user):
    """Return technicians with directeur_valide=false belonging to the director's company."""
    try:
        if not current_user.id_entreprise:
            return jsonify({"success": False, "message": "Directeur non associé à une entreprise"}), 400
        
        technicians = (
            User.query
            .filter(User.id_entreprise == current_user.id_entreprise)
            .filter(User.role.in_(["technicien", "technicien_superieur"]))
            .filter(User.directeur_valide == False)
            .all()
        )
        
        technicians_data = [
            {
                "id": tech.id,
                "name": tech.name,
                "email": tech.email,
                "role": tech.role,
                "birthday": tech.birthday.strftime('%Y-%m-%d') if tech.birthday else None,
                "telephone": tech.telephone,
                "cin": tech.cin,
                "id_assigned": tech.id_assigned,
                "directeur_valide": tech.directeur_valide,
                "email_valide": tech.email_valide,
                "created_at": tech.created_at.isoformat() if tech.created_at else None,
                "id_entreprise": tech.id_entreprise
            } for tech in technicians
        ]
        
        return jsonify({"success": True, "technicians": technicians_data}), 200
    except Exception as e:
        print(f"Error in get_pending_technicians_by_company: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
