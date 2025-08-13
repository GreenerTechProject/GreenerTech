from flask import jsonify, request
from app.models.alerte import Alerte
from database.config import db
from datetime import datetime
from functools import wraps
from app.models.user import User
from app.utils.security import token_required, role_required

# Create new alert
@token_required
@role_required("directeur", "technicien_superieur", "technicien")
def create_alerte(current_user):
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
@token_required
@role_required("directeur", "technicien_superieur")
def get_all_alertes(current_user):
    alertes = Alerte.query.all()
    return jsonify([a.to_dict() for a in alertes]), 200

# Get alerts (general function for the main route)
@token_required
@role_required("technicien", "technicien_superieur", "directeur")
def get_alertes(current_user):
    """Get alerts based on user role and permissions"""
    try:
        if current_user.role == "directeur":
            # Directors can see all alerts from their enterprise
            return get_alertes_by_director_entreprise(current_user)
        elif current_user.role == "technicien_superieur":
            # Senior technicians can see alerts from their assigned serres
            return get_alertes_by_assigned_serres(current_user)
        elif current_user.role == "technicien":
            # Regular technicians can see alerts from their assigned serres
            return get_alertes_by_assigned_serres(current_user)
        else:
            return jsonify({"status": "error", "message": "Rôle non autorisé"}), 403
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Get alerts by assigned serres for a user
@token_required
@role_required("technicien", "technicien_superieur", "directeur")
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
@token_required
@role_required("technicien", "technicien_superieur", "directeur")
def get_alerte(current_user, alert_id):
    alerte = Alerte.query.get(alert_id)
    if not alerte:
        return jsonify({"status": "error", "message": "Alerte non trouvée"}), 404
    return jsonify(alerte.to_dict()), 200

# Update existing alert
@token_required
@role_required("technicien", "technicien_superieur", "directeur")
def update_alerte(current_user, alert_id):
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
@token_required
@role_required("directeur", "technicien_superieur")
def delete_alerte(current_user, alert_id):
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

# Get alerts by enterprise ID for directors
@token_required
@role_required("directeur", "technicien_superieur")
def get_alertes_by_entreprise(current_user, entreprise_id):
    try:
        from app.models.domaine import Domaine
        from app.models.serre import Serre
        from app.models.bilan import Bilan
        
        # Get all domains for the enterprise
        domaines = Domaine.query.filter_by(id_entreprise=entreprise_id).all()
        if not domaines:
            return jsonify([]), 200
        
        domaine_ids = [domaine.id for domaine in domaines]
        
        # Get all serres for these domains
        serres = Serre.query.filter(Serre.id_domaine.in_(domaine_ids)).all()
        if not serres:
            return jsonify([]), 200
        
        serre_ids = [serre.id for serre in serres]
        
        # Get all bilans for these serres
        bilans = Bilan.query.filter(Bilan.id_serre.in_(serre_ids)).all()
        if not bilans:
            return jsonify([]), 200
        
        bilan_ids = [bilan.id for bilan in bilans]
        
        # Get all alerts for these bilans
        alertes = Alerte.query.filter(Alerte.id_bilan.in_(bilan_ids)).all()
        
        # Enhance alert data with location information
        enhanced_alertes = []
        for alerte in alertes:
            # Find the bilan for this alert
            bilan = next((b for b in bilans if b.id == alerte.id_bilan), None)
            if bilan:
                # Find the serre for this bilan
                serre = next((s for s in serres if s.id == bilan.id_serre), None)
                if serre:
                    # Find the domaine for this serre
                    domaine = next((d for d in domaines if d.id == serre.id_domaine), None)
                    if domaine:
                        enhanced_alerte = alerte.to_dict()
                        enhanced_alerte['location'] = {
                            'domaine': domaine.nom,
                            'serre': serre.nom,
                            'domaine_id': domaine.id,
                            'serre_id': serre.id,
                            'entreprise_id': domaine.id_entreprise
                        }
                        enhanced_alertes.append(enhanced_alerte)
        
        return jsonify(enhanced_alertes), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@token_required
@role_required("directeur")
def get_alertes_by_director_entreprise(current_user):
    """Get alerts from director's own enterprise using single JOIN query"""
    try:
        # Single optimized query to get alerts with location info
        query = """
            SELECT 
                a.id,
                a.maladie,
                a.status_alert,
                a.status,
                a.date,
                d.nom as domaine_nom,
                s.nom as serre_nom,
                e.nom as entreprise_nom,
                s.center_lat,
                s.center_lng
            FROM alerte a
            JOIN bilan b ON a.id_bilan = b.id
            JOIN serre s ON b.id_serre = s.id
            JOIN domaine d ON s.id_domaine = d.id
            JOIN entreprise e ON d.id_entreprise = e.id
            WHERE e.id_user = :user_id
            ORDER BY a.date DESC
        """
        
        result = db.session.execute(query, {"user_id": current_user.id})
        
        # Transform results to match frontend interface
        transformed_alertes = []
        for row in result:
            transformed_alerte = {
                "id": str(row.id),
                "type": get_alert_type(row.maladie),
                "severity": get_severity_from_status(row.status_alert),
                "status": "active" if row.status == "non résolue" else "resolved",
                "title": f"{row.maladie} - {row.serre_nom}",
                "description": f"Alerte détectée: {row.maladie}",
                "location": {
                    "domain": row.domaine_nom,
                    "greenhouse": row.serre_nom,
                    "coordinates": {
                        "lat": row.center_lat or 45.764,
                        "lng": row.center_lng or 4.835
                    }
                },
                "timestamp": row.date.isoformat() if row.date else datetime.now().isoformat(),
                "priority": row.status_alert or 5,
                "affectedSystems": ["Système de détection"],
                "estimatedImpact": get_impact_from_severity(row.status_alert)
            }
            transformed_alertes.append(transformed_alerte)
        
        return jsonify(transformed_alertes), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# Helper function to determine alert type from maladie
def get_alert_type(maladie):
    if maladie.lower().find('température') != -1 or maladie.lower().find('chaleur') != -1:
        return 'temperature'
    elif maladie.lower().find('humidité') != -1 or maladie.lower().find('eau') != -1:
        return 'humidity'
    elif maladie.lower().find('irrigation') != -1 or maladie.lower().find('pompe') != -1:
        return 'irrigation'
    elif maladie.lower().find('ventilation') != -1 or maladie.lower().find('air') != -1:
        return 'ventilation'
    elif maladie.lower().find('électricité') != -1 or maladie.lower().find('puissance') != -1:
        return 'power'
    else:
        return 'equipment'

# Helper function to determine severity from status_alert
def get_severity_from_status(status_alert):
    if status_alert >= 8:
        return 'critical'
    elif status_alert >= 6:
        return 'high'
    elif status_alert >= 4:
        return 'medium'
    else:
        return 'low'

# Helper function to determine impact from severity
def get_impact_from_severity(status_alert):
    if status_alert >= 8:
        return 'critical'
    elif status_alert >= 6:
        return 'high'
    elif status_alert >= 4:
        return 'medium'
    else:
        return 'low'
