from flask import request, jsonify
from app.models.autorisation_bilan import Autorisation_bilan
from database.config import db
from app.utils.security import token_required, role_required

@token_required
@role_required("directeur", "technicien_superieur")
def create_autorisation_bilan(current_user):
    data = request.get_json()
    try:
        autorisation_bilan = Autorisation_bilan(
            id_user=data['id_user'],
            id_bilan=data['id_bilan']
        )
        db.session.add(autorisation_bilan)
        db.session.commit()

        return jsonify(autorisation_bilan.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400

@token_required
@role_required("directeur", "technicien_superieur")
def get_autorisation_bilan(current_user, id_bilan):
    autorisation_bilans = Autorisation_bilan.query.filter_by(id_bilan=id_bilan).all()
    if not autorisation_bilans:
        return jsonify({"status": "error", "message": "Aucune autorisation_bilan trouvée pour cette bilan"}), 404

    return jsonify({
        "status": "success",
        "data": [a.to_dict() for a in autorisation_bilans]
    }), 200



@token_required
@role_required("directeur", "technicien_superieur")
def delete_autorisation_bilan(current_user, autorisation_bilan_id):
    autorisation_bilan = Autorisation_bilan.query.get(autorisation_bilan_id)
    if not autorisation_bilan:
        return jsonify({"status": "error", "message": "Autorisation_bilan non trouvée"}), 404

    try:
        db.session.delete(autorisation_bilan)
        db.session.commit()
        return jsonify({
            "status": "success",
            "message": f"Autorisation_bilan {autorisation_bilan_id} supprimée avec succès"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400
