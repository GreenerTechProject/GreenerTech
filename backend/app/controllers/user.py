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

    if user and user.password and check_password_hash(user.password, data['password']):
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

    if not user:
        return jsonify({"message": "Email non trouvé"}), 401
    elif not user.password:
        return jsonify({"message": "Compte non configuré. Veuillez contacter l'administrateur."}), 401
    else:
        return jsonify({"message": "Mot de passe incorrect"}), 401

# === DELETE USER ===
@token_required
def delete_user(current_user):
    try:
        # If the current user is a director, delete the entreprise(s) they created,
        # which will cascade delete domaines, serres, technicians, robots, etc.
        if current_user.role == 'directeur':
            entreprises = Entreprise.query.filter_by(id_user=current_user.id).all()
            for ent in entreprises:
                db.session.delete(ent)

        # Also handle technicians supervised by this user (id_assigned)
        from app.models.user import User as UserModel
        supervised_techs = UserModel.query.filter_by(id_assigned=current_user.id).all()
        for tech in supervised_techs:
            db.session.delete(tech)

        db.session.delete(current_user)
        db.session.commit()
        return jsonify({"message": f"Utilisateur avec l'ID {current_user.id} supprimé avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur lors de la suppression: {str(e)}"}), 500

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
    # Convert company_id to integer for comparison
    try:
        company_id_int = int(company_id)
    except (ValueError, TypeError):
        return jsonify({"message": "ID de l'entreprise invalide"}), 400
    
    if current_user.id_entreprise != company_id_int:
        return jsonify({"message": "Accès non autorisé à cette entreprise"}), 403

    new_user = User(
        email=email,
        name=name,
        role=role,
        id_assigned=None,  # Start with no supervisor assignment
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
    try:
        try:
            company_id_int = int(company_id)
        except (ValueError, TypeError):
            return jsonify({"message": "ID de l'entreprise invalide"}), 400
        
        if current_user.role == 'technicien_superieur' and current_user.id_entreprise != company_id_int:
            print(f"[Backend] Access denied: tech_sup id_entreprise {current_user.id_entreprise} != requested {company_id_int}")
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
                "name": tech.name,  # Keep original name field
                "fullName": tech.name,  # Also provide fullName for frontend compatibility
                "email": tech.email,
                "role": tech.role,
                "telephone": tech.telephone,
                "birthday": tech.birthday.isoformat() if tech.birthday else None,
                "created_at": tech.created_at.isoformat() if tech.created_at else None,
                "updated_at": tech.updated_at.isoformat() if tech.updated_at else None,
                "id_assigned": tech.id_assigned,
                "setup_completed": tech.setup_completed,
                "directeur_valide": tech.directeur_valide,
                "email_valide": tech.email_valide,
                "id_entreprise": tech.id_entreprise,
                "assignedSerres": []  # TODO: Add logic to get assigned serres
            }
            for tech in technicians
        ]
        
        return jsonify({"success": True, "technicians": data}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@token_required
@role_required('directeur', 'technicien_superieur')
def get_techniciens_by_company(current_user, company_id):
    try: 
        try:
            company_id_int = int(company_id)
        except (ValueError, TypeError):
            return jsonify({"message": "ID de l'entreprise invalide"}), 400
        
        if current_user.role == 'technicien_superieur' and current_user.id_entreprise != company_id_int:
            return jsonify({"message": "Non autorisé"}), 403

        technicians = (
            User.query
            .filter(User.id_entreprise == company_id)
            .filter(User.role.in_(["technicien"]))
            .all()
        )
        
        for tech in technicians:
            print(f"[Backend] Tech: {tech.email}, role: {tech.role}, id_entreprise: {tech.id_entreprise}")
        
        data = [
            {
                "id": tech.id,
                "name": tech.name,  
                "fullName": tech.name,  # fullName for frontend compatibility
                "email": tech.email,
                "role": tech.role,
                "telephone": tech.telephone,
                "birthday": tech.birthday.isoformat() if tech.birthday else None,
                "created_at": tech.created_at.isoformat() if tech.created_at else None,
                "updated_at": tech.updated_at.isoformat() if tech.updated_at else None,
                "id_assigned": tech.id_assigned,
                "setup_completed": tech.setup_completed,
                "directeur_valide": tech.directeur_valide,
                "email_valide": tech.email_valide,
                "id_entreprise": tech.id_entreprise,
                "assignedSerres": []  
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
            return jsonify({"error": "Email, mot de passe et rôle sont requis"}), 400

        if not data.get('name') and not (data.get('firstName') and data.get('lastName')):
            return jsonify({"error": "Nom et prénom sont requis"}), 400

        # For pre-registered users, we can derive id_entreprise from their assigned director
        if not data.get('id_entreprise') and not data.get('id_assigned'):
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

# Update user information by director (can be any user in the company)
@token_required
@role_required('directeur')
def update_technicien(current_user, id):
    try:
        data = request.get_json()
        user = User.query.get(id)

        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        # Verify the user belongs to the director's company
        if user.id_entreprise != current_user.id_entreprise:
            return jsonify({"error": "Accès non autorisé à cet utilisateur"}), 403

        # Verify the user is a technician (but allow updates for other roles when called from user route)
        if user.role not in ["technicien", "technicien_superieur"] and current_user.role == "directeur":
            # Allow directors to update any user in their company
            pass
        elif user.role not in ["technicien", "technicien_superieur"]:
            return jsonify({"error": "L'utilisateur n'est pas un technicien"}), 400

        # Update allowed fields
        if 'email' in data:
            # Check if email is already used by another user
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != id:
                return jsonify({"error": "Email déjà utilisé par un autre utilisateur"}), 409
            user.email = data['email']
        
        if 'name' in data:
            user.name = data['name']
        
        if 'role' in data:
            if data['role'] not in ["technicien", "technicien_superieur"]:
                return jsonify({"error": "Rôle invalide. Choisir 'technicien' ou 'technicien_superieur'"}), 400
            user.role = data['role']
        
        if 'directeur_valide' in data:
            user.directeur_valide = data['directeur_valide']
        
        if 'email_valide' in data:
            user.email_valide = data['email_valide']
        
        if 'id_assigned' in data:
            # Validate that the assigned supervisor exists and is a technicien_superieur
            if data['id_assigned'] is not None:
                supervisor = User.query.get(data['id_assigned'])
                if not supervisor:
                    return jsonify({"error": "Superviseur assigné non trouvé"}), 404
                if supervisor.role != "technicien_superieur":
                    return jsonify({"error": "L'utilisateur assigné doit être un technicien_superieur"}), 400
                if supervisor.id_entreprise != current_user.id_entreprise:
                    return jsonify({"error": "Le superviseur doit appartenir à la même entreprise"}), 403
            user.id_assigned = data['id_assigned']

        db.session.commit()

        return jsonify({
            "message": "Utilisateur mis à jour avec succès",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        print(f"Error in update_technicien: {str(e)}")
        return jsonify({"error": f"Erreur lors de la mise à jour: {str(e)}"}), 500

# Delete technician by director
@token_required
@role_required('directeur')
def delete_technicien(current_user, id):
    try:
        user = User.query.get(id)

        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        # Verify the technician belongs to the director's company
        if user.id_entreprise != current_user.id_entreprise:
            return jsonify({"error": "Accès non autorisé à ce technicien"}), 403

        # Verify the user is a technician
        if user.role not in ["technicien", "technicien_superieur"]:
            return jsonify({"error": "L'utilisateur n'est pas un technicien"}), 400

        # Store user info for response
        user_info = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }

        # Delete the user
        db.session.delete(user)
        db.session.commit()

        return jsonify({
            "message": "Technicien supprimé avec succès",
            "deleted_user": user_info
        }), 200

    except Exception as e:
        print(f"Error in delete_technicien: {str(e)}")
        return jsonify({"error": f"Erreur lors de la suppression: {str(e)}"}), 500

# Get interventions by technician ID
@token_required
def get_interventions_by_technicien(current_user, id):
    """Get all interventions for a specific technician"""
    try:
        # Verify the technician belongs to the director's company
        technician = User.query.get(id)
        if not technician:
            return jsonify({"error": "Technicien non trouvé"}), 404
            
        if technician.id_entreprise != current_user.id_entreprise:
            return jsonify({"error": "Accès non autorisé à ce technicien"}), 403

        # Get interventions for this technician
        from app.models.intervention import Intervention
        from app.models.serre import Serre
        from app.models.type_tache import Type_tache
        
        interventions = Intervention.query.filter_by(id_user=id).all()
        
        intervention_list = []
        for intervention in interventions:
            intervention_data = {
                'id': intervention.id,
                'description': intervention.description,
                'status': intervention.status.value if intervention.status else 'encours',
                'date_debut': intervention.date_debut.strftime('%Y-%m-%d') if intervention.date_debut else None,
                'date_fin': intervention.date_fin.strftime('%Y-%m-%d') if intervention.date_fin else None,
                'total_charges': intervention.total_charges,
                'valid': intervention.valid,
                'serre_id': intervention.id_serre,
                'type_tache_id': intervention.id_type_tache
            }
            
            # Get serre information
            serre = Serre.query.get(intervention.id_serre)
            if serre:
                intervention_data['serre_nom'] = serre.nom
                intervention_data['domaine_nom'] = serre.domaine.nom if serre.domaine else "Domaine inconnu"
            
            # Get type_tache information
            type_tache = Type_tache.query.get(intervention.id_type_tache)
            if type_tache:
                intervention_data['type_nom'] = type_tache.nom
            
            # Get technician information
            technician = User.query.get(intervention.id_user)
            if technician:
                intervention_data['technician_name'] = technician.name or f"Utilisateur #{technician.id}"
            else:
                intervention_data['technician_name'] = f"Utilisateur #{intervention.id_user}"
            
            intervention_list.append(intervention_data)
        
        return jsonify({"success": True, "interventions": intervention_list}), 200
        
    except Exception as e:
        print(f"Error in get_interventions_by_technicien: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@token_required
@role_required("directeur", "technicien_superieur")
def remove_technician_assignment(current_user):
    """Remove a technician's assignment to a supervisor"""
    try:
        data = request.get_json()
        technician_id = data.get('technician_id')

        if not technician_id:
            return jsonify({"message": "technician_id est requis"}), 400

        # Check if current user has permission (must be in same company)
        if current_user.id_entreprise is None:
            return jsonify({"message": "Vous devez être associé à une entreprise"}), 403

        # Get the technician
        technician = User.query.get(technician_id)

        if not technician:
            return jsonify({"message": "Technicien non trouvé"}), 404

        # Check if technician is in the same company
        if technician.id_entreprise != current_user.id_entreprise:
            return jsonify({"message": "Non autorisé - technicien hors de votre entreprise"}), 403

        # Check if technician has appropriate role (can remove assignment from both normal technicians and supervisors)
        if technician.role not in ["technicien", "technicien_superieur"]:
            return jsonify({"message": "L'utilisateur doit être un technicien ou technicien superviseur"}), 400

        # Store the old supervisor for response
        old_supervisor_id = technician.id_assigned
        old_supervisor = None
        if old_supervisor_id:
            old_supervisor = User.query.get(old_supervisor_id)

        # Remove the assignment
        technician.id_assigned = None
        db.session.commit()

        return jsonify({
            "message": f"Assignation du technicien {technician.name} retirée avec succès",
            "technician": technician.to_dict(),
            "previous_supervisor": old_supervisor.to_dict() if old_supervisor else None
        }), 200

    except Exception as e:
        print(f"Error in remove_technician_assignment: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Erreur lors du retrait de l'assignation"}), 500


@token_required
@role_required("directeur", "technicien_superieur")
def assign_technician_to_supervisor(current_user):
    """Assign a technician to a supervisor"""
    try:
        data = request.get_json()
        technician_id = data.get('technician_id')
        supervisor_id = data.get('supervisor_id')
        
        if not technician_id or not supervisor_id:
            return jsonify({"message": "technician_id et supervisor_id sont requis"}), 400
        
        # Check if current user has permission (must be in same company)
        if current_user.id_entreprise is None:
            return jsonify({"message": "Vous devez être associé à une entreprise"}), 403
        
        # Get the technician and supervisor
        technician = User.query.get(technician_id)
        supervisor = User.query.get(supervisor_id)
        
        if not technician or not supervisor:
            return jsonify({"message": "Technicien ou superviseur non trouvé"}), 404
        
        # Check if both users are in the same company
        if (technician.id_entreprise != current_user.id_entreprise or 
            supervisor.id_entreprise != current_user.id_entreprise):
            return jsonify({"message": "Non autorisé - utilisateurs hors de votre entreprise"}), 403
        
        # Check if supervisor has appropriate role
        if supervisor.role not in ["technicien_superieur", "directeur"]:
            return jsonify({"message": "Le superviseur doit être un technicien supérieur ou directeur"}), 400
        
        # Check if technician has appropriate role
        if technician.role != "technicien":
            return jsonify({"message": "L'utilisateur doit être un technicien"}), 400
        
        # Assign the technician to the supervisor
        technician.id_assigned = supervisor_id
        db.session.commit()
        
        return jsonify({
            "message": f"Technicien {technician.name} assigné au superviseur {supervisor.name}",
            "technician": technician.to_dict(),
            "supervisor": supervisor.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Error in assign_technician_to_supervisor: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Erreur lors de l'assignation"}), 500

@token_required
@role_required('directeur', 'technicien_superieur')
def get_supervisors_by_company(current_user, company_id):
    """Get all supervisors (technicien_superieur) for a specific company"""
    try: 
        try:
            company_id_int = int(company_id)
        except (ValueError, TypeError):
            return jsonify({"message": "ID de l'entreprise invalide"}), 400
        
        # Check if current user has access to this company
        if current_user.role == 'technicien_superieur' and current_user.id_entreprise != company_id_int:
            return jsonify({"message": "Non autorisé"}), 403
        
        if current_user.role == 'directeur' and current_user.id_entreprise != company_id_int:
            return jsonify({"message": "Non autorisé"}), 403

        supervisors = (
            User.query
            .filter(User.id_entreprise == company_id)
            .filter(User.role == "technicien_superieur")
            .all()
        )
        
        data = [
            {
                "id": sup.id,
                "name": sup.name,  
                "fullName": sup.name,  # fullName for frontend compatibility
                "email": sup.email,
                "role": sup.role,
                "telephone": sup.telephone,
                "birthday": sup.birthday.isoformat() if sup.birthday else None,
                "created_at": sup.created_at.isoformat() if sup.created_at else None,
                "updated_at": sup.updated_at.isoformat() if sup.updated_at else None,
                "id_assigned": sup.id_assigned,
                "setup_completed": sup.setup_completed,
                "directeur_valide": sup.directeur_valide,
                "email_valide": sup.email_valide,
                "id_entreprise": sup.id_entreprise
            }
            for sup in supervisors
        ]
        
        return jsonify({"success": True, "supervisors": data}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


def get_supervisor_by_id(current_user, supervisor_id):
    """Get a specific supervisor by ID"""
    try:
        try:
            supervisor_id_int = int(supervisor_id)
        except (ValueError, TypeError):
            return jsonify({"message": "ID du superviseur invalide"}), 400

        # Get the supervisor
        supervisor = User.query.get(supervisor_id_int)

        if not supervisor:
            return jsonify({"message": "Superviseur non trouvé"}), 404

        # Check if supervisor has the correct role
        if supervisor.role != "technicien_superieur":
            return jsonify({"message": "Cet utilisateur n'est pas un superviseur"}), 400

        # Check if current user has access to this supervisor's company
        if current_user.role == 'technicien_superieur' and current_user.id_entreprise != supervisor.id_entreprise:
            return jsonify({"message": "Non autorisé"}), 403

        if current_user.role == 'directeur' and current_user.id_entreprise != supervisor.id_entreprise:
            return jsonify({"message": "Non autorisé"}), 403

        # Return supervisor data
        data = {
            "id": supervisor.id,
            "name": supervisor.name,
            "fullName": supervisor.name,  # fullName for frontend compatibility
            "email": supervisor.email,
            "role": supervisor.role,
            "telephone": supervisor.telephone,
            "birthday": supervisor.birthday.isoformat() if supervisor.birthday else None,
            "created_at": supervisor.created_at.isoformat() if supervisor.created_at else None,
            "updated_at": supervisor.updated_at.isoformat() if supervisor.updated_at else None,
            "id_assigned": supervisor.id_assigned,
            "setup_completed": supervisor.setup_completed,
            "directeur_valide": supervisor.directeur_valide,
            "email_valide": supervisor.email_valide,
            "id_entreprise": supervisor.id_entreprise
        }

        return jsonify({"success": True, "supervisor": data}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400