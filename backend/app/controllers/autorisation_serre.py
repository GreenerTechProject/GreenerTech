from flask import request, jsonify
from app.models.autorisation_serre import Autorisation_serre
from database.config import db
from app.utils.security import token_required, role_required

@token_required
@role_required("directeur", "technicien_superieur")
def create_autorisation_serre(current_user):
    data = request.get_json()
    try:
        autorisation_serre = Autorisation_serre(
            id_user=data['id_user'],
            id_serre=data['id_serre']
        )
        db.session.add(autorisation_serre)
        db.session.commit()

        return jsonify(autorisation_serre.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400

@token_required
@role_required("directeur", "technicien_superieur")
def get_autorisation_serre(current_user, id_serre):
    autorisation_serres = Autorisation_serre.query.filter_by(id_serre=id_serre).all()
    if not autorisation_serres:
        return jsonify({"status": "error", "message": "Aucune autorisation_serre trouvée pour cette serre"}), 404

    return jsonify({
        "status": "success",
        "data": [a.to_dict() for a in autorisation_serres]
    }), 200



@token_required
@role_required("directeur", "technicien_superieur")
def delete_autorisation_serre(current_user, autorisation_serre_id):
    autorisation_serre = Autorisation_serre.query.get(autorisation_serre_id)
    if not autorisation_serre:
        return jsonify({"status": "error", "message": "Autorisation_serre non trouvée"}), 404

    try:
        db.session.delete(autorisation_serre)
        db.session.commit()
        return jsonify({
            "status": "success",
            "message": f"Autorisation_serre {autorisation_serre_id} supprimée avec succès"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400
