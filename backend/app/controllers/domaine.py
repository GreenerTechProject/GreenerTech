from flask import request, jsonify
from app.models.domaine import Domaine
from database.config import db
from app.utils.security import token_required, role_required
from app.models.entreprise import Entreprise

@token_required
@role_required("directeur")
def create_domaine(current_user):
    data = request.get_json()
    # Récupérer entreprise liée au directeur connecté
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise associée à cet utilisateur"}), 404

    domaine = Domaine(
        nom=data['nom'],
        localisation=data.get('localisation'),
        superficie=data.get('superficie'),
        id_entreprise=entreprise.id
    )
    db.session.add(domaine)
    db.session.commit()
    return jsonify({"message": "Domaine créé", "domaine": domaine.to_dict()}), 201

@token_required
@role_required("directeur")
def get_all_domaines(current_user):
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise associée"}), 404

    domaines = Domaine.query.filter_by(id_entreprise=entreprise.id).all()
    return jsonify([d.to_dict() for d in domaines]), 200

@token_required
@role_required("directeur")
def get_domaine(current_user, id):
    domaine = Domaine.query.get_or_404(id)
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé à accéder à ce domaine"}), 403

    return jsonify(domaine.to_dict()), 200

@token_required
@role_required("directeur")
def update_domaine(current_user, id):
    domaine = Domaine.query.get_or_404(id)
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()
    domaine.nom = data.get('nom', domaine.nom)
    domaine.localisation = data.get('localisation', domaine.localisation)
    domaine.superficie = data.get('superficie', domaine.superficie)
    # id_entreprise ne devrait pas changer via update, donc on ne le modifie pas

    db.session.commit()
    return jsonify({"message": "Domaine mis à jour", "domaine": domaine.to_dict()}), 200

@token_required
@role_required("directeur")
def delete_domaine(current_user, id):
    domaine = Domaine.query.get_or_404(id)
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    db.session.delete(domaine)
    db.session.commit()
    return jsonify({"message": "Domaine supprimé"}), 200
