from flask import request, jsonify
from app.models.domaine import Domaine
from database.config import db
from app.utils.security import token_required, role_required

@token_required
@role_required("directeur")
def create_domaine():
    data = request.get_json()
    domaine = Domaine(
        nom=data['nom'],
        localisation=data['localisation'],
        superficie=data.get('superficie'),
        id_entreprise=data['id_entreprise']
    )
    db.session.add(domaine)
    db.session.commit()
    return jsonify({"message": "Domaine created", "domaine": domaine.to_dict()}), 201

@token_required
@role_required("directeur")
def get_all_domaines():
    domaines = Domaine.query.all()
    return jsonify([d.to_dict() for d in domaines]), 200

@token_required
@role_required("directeur")
def get_domaine_by_id(id):
    domaine = Domaine.query.get_or_404(id)
    return jsonify(domaine.to_dict()), 200

@token_required
@role_required("directeur")
def update_domaine(id):
    data = request.get_json()
    domaine = Domaine.query.get_or_404(id)
    domaine.nom = data.get('nom', domaine.nom)
    domaine.localisation = data.get('localisation', domaine.localisation)
    domaine.superficie = data.get('superficie', domaine.superficie)
    domaine.id_entreprise = data.get('id_entreprise', domaine.id_entreprise)
    db.session.commit()
    return jsonify({"message": "Domaine updated", "domaine": domaine.to_dict()}), 200

@token_required
@role_required("directeur")
def delete_domaine(id):
    domaine = Domaine.query.get_or_404(id)
    db.session.delete(domaine)
    db.session.commit()
    return jsonify({"message": "Domaine deleted"}), 200
