from flask import request, jsonify
from app.models.alerte import Alerte
from database.config import db
from datetime import datetime

# Create new alert
def create_alerte():
    data = request.get_json()
    try:
        alerte = Alerte(
            id_bilan=data["id_bilan"],
            status_alert=data["status_alert"],
            maladie=data["maladie"],
            lien_image=data.get("lien_image"),
            x1=data.get("x1"),
            y1=data.get("y1"),
            status=data.get("status", "non résolue")
        )
        db.session.add(alerte)
        db.session.commit()
        return jsonify(alerte.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400

# Get all alerts
def get_all_alertes():
    alertes = Alerte.query.all()
    return jsonify([a.to_dict() for a in alertes]), 200

# Get alerts by assigned serres for a user
def get_alertes_by_assigned_serres(current_user):
    try:
        # Get serres assigned to the current user
        from app.models.autorisation_serre import Autorisation_serre
        from app.models.bilan import Bilan
        
        # Get user's assigned serres
        autorisations = Autorisation_serre.query.filter_by(id_user=current_user.id).all()
        assigned_serre_ids = [auth.id_serre for auth in autorisations]
        
        if not assigned_serre_ids:
            return jsonify([]), 200
        
        # Get bilans from assigned serres
        bilans = Bilan.query.filter(Bilan.id_serre.in_(assigned_serre_ids)).all()
        bilan_ids = [bilan.id for bilan in bilans]
        
        if not bilan_ids:
            return jsonify([]), 200
        
        # Get alerts from those bilans
        alertes = Alerte.query.filter(Alerte.id_bilan.in_(bilan_ids)).all()
        
        return jsonify([a.to_dict() for a in alertes]), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Get alert by ID
def get_alerte(alert_id):
    alerte = Alerte.query.get(alert_id)
    if not alerte:
        return jsonify({"status": "error", "message": "Alerte non trouvée"}), 404
    return jsonify(alerte.to_dict()), 200

# Update existing alert
def update_alerte(alert_id):
    alerte = Alerte.query.get(alert_id)
    if not alerte:
        return jsonify({"status": "error", "message": "Alerte non trouvée"}), 404

    data = request.get_json()
    try:
        alerte.status_alert = data.get("status_alert", alerte.status_alert)
        alerte.maladie = data.get("maladie", alerte.maladie)
        alerte.lien_image = data.get("lien_image", alerte.lien_image)
        alerte.x1 = data.get("x1", alerte.x1)
        alerte.y1 = data.get("y1", alerte.y1)
        alerte.status = data.get("status", alerte.status)

        db.session.commit()
        return jsonify(alerte.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400

# Delete alert
def delete_alerte(alert_id):
    alerte = Alerte.query.get(alert_id)
    if not alerte:
        return jsonify({"status": "error", "message": "Alerte non trouvée"}), 404
    try:
        db.session.delete(alerte)
        db.session.commit()
        return jsonify({"status": "success", "message": "Alerte supprimée"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400
