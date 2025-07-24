import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from app.models.user import User

# === Générer un token ===
def generate_token(user_id):
    token = jwt.encode({
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")
    return token

# === Décorateur : Authentification requise ===
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({"message": "User not found"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token"}), 401

        return f(current_user, *args, **kwargs)
    return decorated

# === Décorateur : Authentification requise ===
def token_unrequired(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if token:
            try:
                # Try to decode the token
                data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
                current_user = User.query.get(data['user_id'])
                if current_user:
                    return jsonify({"message": "Already authenticated"}), 403
            except jwt.ExpiredSignatureError:
                pass  # expired token is considered as not authenticated
            except jwt.InvalidTokenError:
                pass  # invalid token also means not authenticated

        return f(*args, **kwargs)
    return decorated

# === Décorateur : Vérification de rôle ===
def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.role not in allowed_roles:
                return jsonify({"message": "Access denied: unauthorized role"}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator








from app.models.autorisation_domaine import Autorisation_domaine

def access_domaine_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        # Extract domaine ID either from JSON body or URL parameters
        data = request.get_json(silent=True) or {}
        id_domaine = data.get('id_domaine') or kwargs.get('id_domaine')
        
        if not id_domaine:
            return jsonify({"message": "ID de la domaine manquant"}), 400

        # Check access authorization
        has_access = Autorisation_domaine.query.filter_by(id_user=current_user.id, id_domaine=id_domaine).first()

        if not has_access:
            return jsonify({"message": "Accès non autorisé à cette domaine"}), 403

        return f(current_user, *args, **kwargs)
    return decorated








from app.models.autorisation_serre import Autorisation_serre

def access_serre_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        # Extract serre ID either from JSON body or URL parameters
        data = request.get_json(silent=True) or {}
        id_serre = data.get('id_serre') or kwargs.get('id_serre')
        
        if not id_serre:
            return jsonify({"message": "ID de la serre manquant"}), 400

        # Check access authorization
        has_access = Autorisation_serre.query.filter_by(id_user=current_user.id, id_serre=id_serre).first()

        if not has_access:
            return jsonify({"message": "Accès non autorisé à cette serre"}), 403

        return f(current_user, *args, **kwargs)
    return decorated









from app.models.autorisation_bilan import Autorisation_bilan

def access_bilan_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        # Extract bilan ID either from JSON body or URL parameters
        data = request.get_json(silent=True) or {}
        id_bilan = data.get('id_bilan') or kwargs.get('id_bilan')
        
        if not id_bilan:
            return jsonify({"message": "ID de la bilan manquant"}), 400

        # Check access authorization
        has_access = Autorisation_bilan.query.filter_by(id_user=current_user.id, id_bilan=id_bilan).first()

        if not has_access:
            return jsonify({"message": "Accès non autorisé à cette bilan"}), 403

        return f(current_user, *args, **kwargs)
    return decorated
