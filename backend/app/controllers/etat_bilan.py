from flask import request, jsonify
from app.models.etat_bilan import Etat_bilan
from database.config import db
from app.utils.security import token_required, role_required

@token_required
@role_required("directeur", "technicien_superieur", "technicien")
def create_etat_bilan(current_user):
    data = request.get_json()
    try:
        etat = Etat_bilan(
            id_bilan=data['id_bilan'],
            nombre_tomates_maladies=data.get('nombre_tomates_maladies', 0),
            nombre_tomates_non_maladies=data.get('nombre_tomates_non_maladies', 0),
            nombre_malade1=data.get('nombre_malade1', 0),
            nombre_malade2=data.get('nombre_malade2', 0),
            temperature=data.get('temperature'),
            humidite=data.get('humidite'),
            luminosite=data.get('luminosite'),
            co2=data.get('co2'),
            rendement=data.get('rendement')
        )
        db.session.add(etat)
        db.session.commit()
        return jsonify(etat.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400


@token_required
def get_etat_bilan(current_user, etat_bilan_id):
    etat = Etat_bilan.query.get(etat_bilan_id)
    if not etat:
        return jsonify({"status": "error", "message": "Etat_bilan non trouvé"}), 404
    return jsonify(etat.to_dict()), 200


@token_required
def get_etat_bilan_by_bilan(current_user, bilan_id):
    etats = Etat_bilan.query.filter_by(id_bilan=bilan_id).all()
    return jsonify([e.to_dict() for e in etats]), 200


@token_required
@role_required("directeur", "technicien_superieur")
def update_etat_bilan(current_user, etat_bilan_id):
    etat = Etat_bilan.query.get(etat_bilan_id)
    if not etat:
        return jsonify({"status": "error", "message": "Etat_bilan non trouvé"}), 404

    data = request.get_json()
    try:
        etat.nombre_tomates_maladies = data.get('nombre_tomates_maladies', etat.nombre_tomates_maladies)
        etat.nombre_tomates_non_maladies = data.get('nombre_tomates_non_maladies', etat.nombre_tomates_non_maladies)
        etat.nombre_malade1 = data.get('nombre_malade1', etat.nombre_malade1)
        etat.nombre_malade2 = data.get('nombre_malade2', etat.nombre_malade2)
        etat.temperature = data.get('temperature', etat.temperature)
        etat.humidite = data.get('humidite', etat.humidite)
        etat.luminosite = data.get('luminosite', etat.luminosite)
        etat.co2 = data.get('co2', etat.co2)
        etat.rendement = data.get('rendement', etat.rendement)

        db.session.commit()
        return jsonify(etat.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400


@token_required
@role_required("directeur")
def delete_etat_bilan(current_user, etat_bilan_id):
    etat = Etat_bilan.query.get(etat_bilan_id)
    if not etat:
        return jsonify({"status": "error", "message": "Etat_bilan non trouvé"}), 404
    try:
        db.session.delete(etat)
        db.session.commit()
        return jsonify({"status": "success", "message": "Etat_bilan supprimé"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400
