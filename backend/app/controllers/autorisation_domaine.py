from flask import request, jsonify
from app.models.autorisation_domaine import Autorisation_domaine
from database.config import db
from app.utils.security import token_required, role_required

@token_required
@role_required("directeur", "technicien_superieur")
def create_autorisation_domaine(current_user):
    data = request.get_json()
    try:
        autorisation_domaine = Autorisation_domaine(
            id_user=data['id_user'],
            id_domaine=data['id_domaine']
        )
        db.session.add(autorisation_domaine)
        db.session.commit()

        return jsonify(autorisation_domaine.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400

@token_required
@role_required("directeur", "technicien_superieur")
def get_autorisation_domaine(current_user, id_domaine):
    autorisation_domaines = Autorisation_domaine.query.filter_by(id_domaine=id_domaine).all()
    if not autorisation_domaines:
        return jsonify({"status": "error", "message": "Aucune autorisation_domaine trouvée pour cette domaine"}), 404

    return jsonify({
        "status": "success",
        "data": [a.to_dict() for a in autorisation_domaines]
    }), 200



@token_required
@role_required("directeur", "technicien_superieur")
def delete_autorisation_domaine(current_user, autorisation_domaine_id):
    autorisation_domaine = Autorisation_domaine.query.get(autorisation_domaine_id)
    if not autorisation_domaine:
        return jsonify({"status": "error", "message": "Autorisation_domaine non trouvée"}), 404

    try:
        db.session.delete(autorisation_domaine)
        db.session.commit()
        return jsonify({
            "status": "success",
            "message": f"Autorisation_domaine {autorisation_domaine_id} supprimée avec succès"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400
