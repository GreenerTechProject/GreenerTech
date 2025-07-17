from flask import request, jsonify
from app.models.entreprise import Entreprise
from database.config import db
from app.utils.security import token_required, role_required

# === Créer une entreprise ===
@token_required
@role_required("directeur")
def create_entreprise(current_user):
    data = request.get_json()
    entreprise = Entreprise(
        nom=data['nom'],
        id_user=current_user.id,
        status_juridique=data.get('status_juridique'),
        adresse=data.get('adresse'),
        id_fiscale=data.get('id_fiscale'),
        email=data.get('email')
    )
    db.session.add(entreprise)
    db.session.commit()
    return jsonify({"message": "Entreprise créée avec succès"}), 201

# === Récupérer l'entreprise du directeur connecté ===
@token_required
@role_required("directeur")
def get_my_entreprise(current_user):
    entreprises = Entreprise.query.filter_by(id_user=str(current_user.id)).all()
    
    if not entreprises:
        return jsonify({"message": "Aucune entreprise trouvée"}), 404

    result = []
    for e in entreprises:
        result.append({
            "id": e.id,
            "nom": e.nom,
            "status_juridique": e.status_juridique,
            "adresse": e.adresse,
            "id_fiscale": e.id_fiscale,
            "email": e.email
        })

    return jsonify(result), 200
# === Modifier l'entreprise du directeur ===
@token_required
@role_required("directeur")
def update_entreprise(current_user):
    entreprise = Entreprise.query.filter_by(id_user=str(current_user.id)).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise trouvée"}), 404

    data = request.get_json()
    entreprise.nom = data.get('nom', entreprise.nom)
    entreprise.status_juridique = data.get('status_juridique', entreprise.status_juridique)
    entreprise.adresse = data.get('adresse', entreprise.adresse)
    entreprise.id_fiscale = data.get('id_fiscale', entreprise.id_fiscale)
    entreprise.email = data.get('email', entreprise.email)

    db.session.commit()
    return jsonify({"message": "Entreprise mise à jour"}), 200

# === Supprimer l'entreprise du directeur ===
@token_required
@role_required("directeur")
def delete_entreprise(current_user):
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise trouvée"}), 404

    db.session.delete(entreprise)
    db.session.commit()
    return jsonify({"message": "Entreprise supprimée"}), 200
