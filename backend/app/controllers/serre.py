# app/controllers/serre.py
from flask import request, jsonify
from app.models.serre import Serre
from database.config import db
from app.utils.security import token_required, role_required
from datetime import datetime

@token_required
@role_required(['directeur' , 'technicien_superieur'])
def ajouter_serre(current_user):
    data = request.get_json()

    nom_serre = data.get("nom_serre")
    id_group_cor = data.get("id_group_cor")
    date_creation = data.get("date_creation")
    id_domaine = data.get("id_domaine")

    if not all([nom_serre, id_group_cor, date_creation, id_domaine]):
        return jsonify({"message": "All fields are required."}), 400

    try:
        nouvelle_serre = Serre(
            nom_serre=nom_serre,
            id_group_cor=id_group_cor,
            date_creation=datetime.strptime(date_creation, "%Y-%m-%d"),
            id_domaine=id_domaine
        )

        db.session.add(nouvelle_serre)
        db.session.commit()

        return jsonify({"message": "Serre added successfully."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500

@token_required
@role_required(['directeur', 'technicien_superieur'])
def get_serres(current_user):
    serres = Serre.query.all()
    result = []

    for serre in serres:
        result.append({
            "id": serre.id,
            "nom_serre": serre.nom_serre,
            "id_group_cor": serre.id_group_cor,
            "date_creation": serre.date_creation.strftime("%Y-%m-%d"),
            "id_domaine": serre.id_domaine
        })

    return jsonify(result), 200

@token_required
@role_required(['directeur', 'technicien_superieur'])
def modifier_serre(current_user, serre_id):
    data = request.get_json()
    serre = Serre.query.get(serre_id)

    if not serre:
        return jsonify({"message": "Serre not found."}), 404

    try:
        serre.nom_serre = data.get("nom_serre", serre.nom_serre)
        serre.id_group_cor = data.get("id_group_cor", serre.id_group_cor)
        serre.date_creation = datetime.strptime(data.get("date_creation"), "%Y-%m-%d") if data.get("date_creation") else serre.date_creation
        serre.id_domaine = data.get("id_domaine", serre.id_domaine)

        db.session.commit()
        return jsonify({"message": "Serre updated successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Update error: {str(e)}"}), 500


# Suppression d'une serre
@token_required
@role_required(['directeur', 'technicien_superieur'])
def supprimer_serre(current_user, serre_id):
    serre = Serre.query.get(serre_id)

    if not serre:
        return jsonify({"message": "Serre not found."}), 404

    try:
        db.session.delete(serre)
        db.session.commit()
        return jsonify({"message": "Serre deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Deletion error: {str(e)}"}), 500
    
@token_required
@role_required(['directeur', 'technicien_superieur'])
def get_serre_by_id(current_user, serre_id):
    serre = Serre.query.get(serre_id)

    if not serre:
        return jsonify({"message": "Serre not found."}), 404

    result = {
        "id": serre.id,
        "nom_serre": serre.nom_serre,
        "id_group_cor": serre.id_group_cor,
        "date_creation": serre.date_creation.strftime("%Y-%m-%d"),
        "id_domaine": serre.id_domaine
    }

    return jsonify(result), 200


