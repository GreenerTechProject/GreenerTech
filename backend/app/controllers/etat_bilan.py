from flask import request, jsonify
from app.models.etat_bilan import Etat_bilan
from app.models.bilan import Bilan
from database.config import db
from app.utils.security import token_required, role_required
from sqlalchemy import func


#@token_required
#@role_required("directeur", "technicien_superieur", "technicien")
def create_etat_bilan():
    data = request.get_json()
    try:
        etat = Etat_bilan(
            id_bilan=data['id_bilan'],
            nombre_tomates_maladies=data.get('nombre_tomates_maladies', 0),
            nombre_tomates_non_maladies=data.get('nombre_tomates_non_maladies', 0),
            nombre_malade1=data.get('nombre_malade1', 0),
            nombre_malade2=data.get('nombre_malade2', 0),
            
            mean_temperature=data.get('mean_temperature'),
            mean_humidite=data.get('mean_humidite'),
            mean_luminosite=data.get('mean_luminosite'),
            mean_co2=data.get('mean_co2'),
            
            max_temperature=data.get('max_temperature'),
            max_humidite=data.get('max_humidite'),
            max_luminosite=data.get('max_luminosite'),
            max_co2=data.get('max_co2'),
            
            min_temperature=data.get('min_temperature'),
            min_humidite=data.get('min_humidite'),
            min_luminosite=data.get('min_luminosite'),
            min_co2=data.get('min_co2'),
            
            #rendement=data.get('rendement')
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
def get_last_etat_bilan_by_bilan(current_user ,bilan_id) :
    try:
        # Subquery to get latest etat_bilan id for the given bilan
        subquery = (
            db.session.query(
                func.max(Etat_bilan.id).label("max_etat_id")
            )
            .filter(Etat_bilan.id_bilan == bilan_id)
            .subquery()
        )

        # Main query: get full Etat_bilan row matching max id
        result = (
            db.session.query(Etat_bilan)
            .join(subquery, Etat_bilan.id == subquery.c.max_etat_id)
            .first()
        )

        if not result:
            return jsonify({"status": "error", "message": "Aucun état de bilan trouvé pour ce bilan"}), 404

        return jsonify(result.to_dict()), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400







@token_required
def get_last_etat_bilan_by_serre(current_user, serre_id):
    try:
        # Subquery to get latest etat_bilan id per bilan (in the serre)
        subquery = (
            db.session.query(
                Etat_bilan.id_bilan,
                func.max(Etat_bilan.id).label("max_etat_id")
            )
            .join(Bilan, Etat_bilan.id_bilan == Bilan.id)
            .filter(Bilan.id_serre == serre_id)
            .group_by(Etat_bilan.id_bilan)
            .subquery()
        )

        # Main query: get full Etat_bilan rows matching max id
        results = (
            db.session.query(Etat_bilan)
            .join(subquery, Etat_bilan.id == subquery.c.max_etat_id)
            .all()
        )

        return jsonify([etat.to_dict() for etat in results]), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


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
        
        etat.mean_temperature = data.get('mean_temperature', etat.mean_temperature)
        etat.mean_humidite = data.get('mean_humidite', etat.mean_humidite)
        etat.mean_luminosite = data.get('mean_luminosite', etat.mean_luminosite)
        etat.mean_co2 = data.get('mean_co2', etat.mean_co2)
        
        etat.max_temperature = data.get('max_temperature', etat.max_temperature)
        etat.max_humidite = data.get('max_humidite', etat.max_humidite)
        etat.max_luminosite = data.get('max_luminosite', etat.max_luminosite)
        etat.max_co2 = data.get('max_co2', etat.max_co2)
        
        etat.min_temperature = data.get('min_temperature', etat.min_temperature)
        etat.min_humidite = data.get('min_humidite', etat.min_humidite)
        etat.min_luminosite = data.get('min_luminosite', etat.min_luminosite)
        etat.min_co2 = data.get('min_co2', etat.min_co2)
        
        #etat.rendement = data.get('rendement', etat.rendement)

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
