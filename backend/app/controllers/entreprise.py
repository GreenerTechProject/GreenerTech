from flask import request, jsonify
from app.models.entreprise import Entreprise
from database.config import db
from app.utils.security import token_required, role_required
from app.models.user import User

@token_required
@role_required("directeur")
def create_entreprise(current_user):
    data = request.get_json()
    entreprise = Entreprise(
        nom=data['nom'],
        # id_user=current_user.id,
        status_juridique=data.get('status_juridique'),
        adresse=data.get('adresse'),
        cie=data.get('cie'),
        id_fiscale=data.get('id_fiscale'),
        email=data.get('email')
    )

    db.session.add(entreprise)
    # recuprer id de l'entreprise nouvellement créée
    db.session.flush()
    # Associer l'entreprise à l'utilisateur actuel
    current_user.id_entreprise = entreprise.id
    db.session.add(current_user)  # Mettre à jour l'utilisateur avec l'id_entreprise
    db.session.commit()
   #return jsonify({"message": "Entreprise créée avec succès", "entreprise": entreprise.to_dict()}), 201
    return jsonify(entreprise.to_dict()), 201

# === Récupérer l'entreprise du directeur connecté ===
@token_required
@role_required("directeur")
def get_entreprise(current_user):
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
            "cie": e.cie,
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
    entreprise.cie = data.get('cie', entreprise.cie)
    entreprise.id_fiscale = data.get('id_fiscale', entreprise.id_fiscale)
    entreprise.email = data.get('email', entreprise.email)

    db.session.commit()
    #return jsonify({"message": "Entreprise mise à jour"}), 200
    return jsonify(entreprise.to_dict()), 200

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


# === Récupérer toutes les entreprises ===
def list_entreprises():
    try:
        entreprises = Entreprise.query.all()
        entreprise_list = [e.to_dict() for e in entreprises]

        return jsonify(entreprise_list), 200
    except Exception as e:
        print("Erreur dans list_entreprises:", str(e))
        return jsonify({"error": "Erreur lors de la récupération des entreprises"}), 500