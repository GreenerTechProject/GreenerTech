from flask import jsonify, request
from app.models.alerte import Alerte
from database.config import db
from sqlalchemy import text
from datetime import datetime
from functools import wraps
from app.models.user import User
from app.utils.security import token_required, role_required
from app.models.autorisation_serre import Autorisation_serre
from app.models.bilan import Bilan
from app.models.domaine import Domaine
from app.models.serre import Serre



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

@token_required
@role_required("directeur", "technicien_superieur", "technicien")
def get_alertes(current_user):
    try:
        if current_user.role == "directeur":
            return get_alertes_by_director_entreprise(current_user)
        elif current_user.role == "technicien_superieur":
            # Get alerts for assigned serres
            autorisations = Autorisation_serre.query.filter_by(id_user=current_user.id).all()
            assigned_serre_ids = [auth.id_serre for auth in autorisations]
            
            if not assigned_serre_ids:
                return jsonify([]), 200
            
            bilans = Bilan.query.filter(Bilan.id_serre.in_(assigned_serre_ids)).all()
            bilan_ids = [bilan.id for bilan in bilans]
            
            if not bilan_ids:
                return jsonify([]), 200
            
            alertes = Alerte.query.filter(Alerte.id_bilan.in_(bilan_ids)).all()
            
            return jsonify([a.to_dict() for a in alertes]), 200
        elif current_user.role == "technicien":
            # Get alerts for assigned serres
            autorisations = Autorisation_serre.query.filter_by(id_user=current_user.id).all()
            assigned_serre_ids = [auth.id_serre for auth in autorisations]
            
            if not assigned_serre_ids:
                return jsonify([]), 200
            
            bilans = Bilan.query.filter(Bilan.id_serre.in_(assigned_serre_ids)).all()
            bilan_ids = [bilan.id for bilan in bilans]
            
            if not bilan_ids:
                return jsonify([]), 200
            
            alertes = Alerte.query.filter(Alerte.id_bilan.in_(bilan_ids)).all()
            
            return jsonify([a.to_dict() for a in alertes]), 200
        else:
            return jsonify({"status": "error", "message": "Rôle non autorisé"}), 403
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Get alert by ID
@token_required
@role_required("directeur", "technicien_superieur", "technicien")
def get_alerte(current_user, alerte_id):
    alerte = Alerte.query.get(alerte_id)
    if not alerte:
        return jsonify({"status": "error", "message": "Alerte non trouvée"}), 404
    return jsonify(alerte.to_dict()), 200

# Update existing alert
@token_required
@role_required("directeur", "technicien_superieur", "technicien")
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

# Get alerts by enterprise ID for directors
@token_required
@role_required("directeur", "technicien_superieur")
def get_alertes_by_entreprise(current_user, entreprise_id):
    try:
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
    try:
        query = """
            SELECT 
                a.id,
                a.maladie,
                a.status_alert,
                a.status,
                a.date,
                d.nom AS domaine_nom,
                s.nom AS serre_nom,
                e.nom AS entreprise_nom,
                s.center_lat,
                s.center_lng
            FROM alertes a
            JOIN bilans b ON a.id_bilan = b.id
            JOIN serres s ON b.id_serre = s.id
            JOIN domaines d ON s.id_domaine = d.id
            JOIN entreprises e ON d.id_entreprise = e.id
            WHERE e.id_user = :user_id
            ORDER BY a.date DESC
        """

        result = db.session.execute(text(query), {"user_id": current_user.id})

        transformed_alertes = []
        for row in result.mappings():
            transformed_alerte = {
                "id": str(row["id"]),
                "type": str(row["maladie"]),
                "severity": get_severity_from_status(row["status_alert"]),
                "status": "active" if row["status"] == "non résolue" else "resolved",
                "title": f"{row['maladie']} - {row['serre_nom']}",
                "description": f"Alerte détectée: {row['maladie']}",
                "location": {
                    "domain": row["domaine_nom"],
                    "greenhouse": row["serre_nom"],
                    "coordinates": {
                        "lat": row["center_lat"] or 45.764,
                        "lng": row["center_lng"] or 4.835
                    }
                },
                "timestamp": row["date"].isoformat() if row["date"] else datetime.now().isoformat(),
                "priority": row["status_alert"] if row["status_alert"] is not None else 0,
                "estimatedImpact": get_impact_from_severity(row["status_alert"]) 
            }
            print(f"[DEBUG] Transformed alert: {transformed_alerte}")  # Debug line
            transformed_alertes.append(transformed_alerte)

        return jsonify(transformed_alertes), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# Helper function to determine alert type from maladie

# Helper function to determine severity from status_alert
def get_severity_from_status(status_alert):
    if status_alert == 2:
        return 'critical'
    elif status_alert == 1:
        return 'medium'
    elif status_alert == 0:
        return 'low'
    else:
        return 'low'  # default fallback

# Helper function to determine impact from severity
def get_impact_from_severity(status_alert):
    if status_alert == 2:
        return 'critical'
    elif status_alert == 1:
        return 'medium'
    elif status_alert == 0:
        return 'low'
    else:
        return 'low'  # default fallback
