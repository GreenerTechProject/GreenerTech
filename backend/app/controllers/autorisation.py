from flask import request, jsonify
from models.autorisation import Autorisation
from database.config import db
from app.utils.security import token_required, role_required

@token_required
@role_required("directeur", "technicien_superieur")
def create_autorisation():
    data = request.get_json()
    try:
        autorisation = Autorisation(
            id_user=data['id_user'],
            id_serre=data['id_serre'],
            access_serre=data['access_serre']
        )
        db.session.add(autorisation)
        db.session.commit()

        return jsonify(autorisation.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400

@token_required
@role_required("directeur", "technicien_superieur")
def get_autorisations(id_serre):
    autorisations = Autorisation.query.filter_by(id_serre=id_serre).all()
    if not autorisations:
        return jsonify({"status": "error", "message": "Aucune autorisation trouvée pour cette serre"}), 404

    return jsonify({
        "status": "success",
        "data": [a.to_dict() for a in autorisations]
    }), 200



@token_required
@role_required("directeur", "technicien_superieur")
def delete_autorisation(autorisation_id):
    autorisation = Autorisation.query.get(autorisation_id)
    if not autorisation:
        return jsonify({"status": "error", "message": "Autorisation non trouvée"}), 404

    try:
        db.session.delete(autorisation)
        db.session.commit()
        return jsonify({
            "status": "success",
            "message": f"Autorisation {autorisation_id} supprimée avec succès"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400
