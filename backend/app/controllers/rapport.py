from flask import request, jsonify, render_template
from app.models.rapport import Rapport
from app.models.user import User
from app.utils.security import token_required, role_required
from database.config import db
from weasyprint import HTML
from app.models.bilan import Bilan
from datetime import datetime, date
import os
import uuid
from  app.models.alerte import Alerte  
from app.models.etat_bilan import Etat_bilan  # Assure-toi que c'est bien importé
from sqlalchemy import text
from app.models.serre import Serre
from app.models.domaine import Domaine
from app.models.entreprise import Entreprise
from app.models.autorisation_serre import Autorisation_serre

# @token_required
# @role_required("technicien", "directeur")
# def create_rapport(current_user):
#     data = request.get_json()
#     description = data.get("description")
#     id_serre = data.get("id_serre")
#     etat_bilan_ids = data.get("etat_bilan_ids", [])

#     if not description or not id_serre:
#         return jsonify({"message": "Champs requis manquants"}), 400

#     # Créer le dossier des rapports
#     output_dir = "static/rapports"
#     os.makedirs(output_dir, exist_ok=True)

#     # Nom unique du PDF
#     nom_pdf = f"rapport_{uuid.uuid4().hex}.pdf"
#     chemin_pdf = os.path.join(output_dir, nom_pdf)

#     # Récupérer le nom du technicien
#     user = User.query.get(current_user.id)
#     nom_user = user.name

#     # Récupérer les objets EtatBilan correspondants
#     etats_bilan = EtatBilan.query.filter(EtatBilan.id.in_(etat_bilan_ids)).all()

#     # Générer le PDF
#     generer_pdf_rapport(description, nom_user, id_serre, chemin_pdf, etats_bilan)

#     # Sauvegarder le rapport en base
#     rapport = Rapport(
#         description=description,
#         lien_pdf=chemin_pdf,
#         id_serre=id_serre,
#         user_id=current_user.id,
#         date=date.today()
#     )
#     db.session.add(rapport)
#     db.session.commit()

#     return jsonify({"message": "Rapport généré avec succès", "lien_pdf": chemin_pdf}), 201


# def generer_pdf_rapport(description, nom, id_serre, output_path, etats_bilan):
#     html = render_template(
#         "rapport_template.html",
#         description=description,
#         user_name=nom,
#         id_serre=id_serre,
#         date=datetime.now().strftime('%Y-%m-%d %H:%M'),
#         etats_bilan=etats_bilan
#     )
#     HTML(string=html).write_pdf(output_path)

# -------------------------------------------------------------------

# @token_required
# @role_required("technicien", "directeur")
# def create_rapport(current_user):
#     data = request.get_json()
#     description = data.get("description")
#     id_serre = data.get("id_serre")
#     # recuperer tous les id des bilans conserner ou ce rapport
#     id_bilan = data.get("ids_bilans", [])
#     # recuperer seulement la dernier etat de  chaque bilan dans la table d'etat_bilan
#     etat_bilan = Etat_bilan.query.filter(Etat_bilan.id_bilan.in_(id_bilan)).order_by(Etat_bilan.date.desc()).all()
#     # etat_bilan = Etat_bilan.query.filter(Etat_bilan.id_bilan.in_(id_bilan)).all()
#     # recuperer les alertes conserner par ce rapport
#     alertes = Alerte.query.filter(Alerte.id_bilan.in_(id_bilan)).all()


#     if not description or not id_serre:
#         return jsonify({"message": "Champs requis manquants"}), 400

#     # Créer le dossier des rapports s’il n'existe pas
#     output_dir = "app/static/rapports"
#     os.makedirs(output_dir, exist_ok=True)

#     # Nom unique du PDF
#     nom_pdf = f"rapport_{uuid.uuid4().hex}.pdf"
#     chemin_pdf = os.path.join(output_dir, nom_pdf)
#     # recuperer le nom de technicien de current_user
#     user = User.query.get(current_user.id)
#     nom_user=user.name
#     # Génération du PDF via HTML
#     generer_pdf_rapport(description, nom_user, id_serre, chemin_pdf, etat_bilan, alertes)
#     # Création du rapport en BDD
#     rapport = Rapport(
#         description=description,
#         lien_pdf="static/rapports/"+nom_pdf,
#         id_serre=id_serre,
#         user_id=current_user.id,
#         date=date.today()
#     )
#     db.session.add(rapport)
#     db.session.commit()

#     return jsonify(rapport.to_dict()), 201


@token_required
@role_required("technicien", "directeur")
def create_rapport(current_user):
    data = request.get_json()
    description = data.get("description")
    id_serre = data.get("id_serre")
    ids_bilans = data.get("ids_bilans", [])

    # Récupérer les dates de début et fin (au format string ISO "YYYY-MM-DD")
    date_debut_str = data.get("date_debut")
    date_fin_str = data.get("date_fin")

    if not description or not id_serre:
        return jsonify({"message": "Champs requis manquants"}), 400

    # Si aucun bilan n'est spécifié, récupérer tous les bilans de la serre
    if not ids_bilans:
        from app.models.bilan import Bilan
        serre_bilans = Bilan.query.filter_by(id_serre=id_serre).all()
        ids_bilans = [bilan.id for bilan in serre_bilans]

    # Convertir les dates en objets datetime si présentes
    date_debut = None
    date_fin = None
    try:
        if date_debut_str:
            # Handle both ISO format and custom format
            try:
                date_debut = datetime.fromisoformat(date_debut_str.replace('Z', '+00:00'))
            except ValueError:
                date_debut = datetime.strptime(date_debut_str, "%d/%m/%Y %H:%M")
        if date_fin_str:
            try:
                date_fin = datetime.fromisoformat(date_fin_str.replace('Z', '+00:00'))
            except ValueError:
                date_fin = datetime.strptime(date_fin_str, "%d/%m/%Y %H:%M")
    except ValueError:
        return jsonify({"message": "Format de date invalide"}), 400

    # Construire la requête pour récupérer les états de bilan
    query_etat = Etat_bilan.query.filter(Etat_bilan.id_bilan.in_(ids_bilans))
    if date_debut:
        query_etat = query_etat.filter(Etat_bilan.date >= date_debut)
    if date_fin:
        query_etat = query_etat.filter(Etat_bilan.date <= date_fin)
    etat_bilan = query_etat.order_by(Etat_bilan.date.desc()).all()

    # Filtrer les alertes par date aussi
    query_alertes = Alerte.query.filter(Alerte.id_bilan.in_(ids_bilans))
    if date_debut:
        query_alertes = query_alertes.filter(Alerte.date >= date_debut)
    if date_fin:
        query_alertes = query_alertes.filter(Alerte.date <= date_fin)

    alertes = query_alertes.order_by(Alerte.date.desc()).all()

    # Créer le dossier des rapports s’il n'existe pas
    output_dir = "app/static/rapports"
    os.makedirs(output_dir, exist_ok=True)

    nom_pdf = f"rapport_{uuid.uuid4().hex}.pdf"
    chemin_pdf = os.path.join(output_dir, nom_pdf)

    user = User.query.get(current_user.id)
    nom_user = user.name

    generer_pdf_rapport(description, nom_user, id_serre, chemin_pdf, etat_bilan, alertes)

    rapport = Rapport(
        description=description,
        lien_pdf="static/rapports/" + nom_pdf,
        id_serre=id_serre,
        user_id=current_user.id,
        date=date.today()
    )
    db.session.add(rapport)
    db.session.commit()

    return jsonify(rapport.to_dict()), 201



# get rapport by user 
@token_required
@role_required("technicien", "directeur")
def get_rapports_by_user(current_user):
    rapports = Rapport.query.filter_by(user_id=current_user.id).all()
    if not rapports:
        return jsonify({"message": "Aucun rapport trouvé pour cet utilisateur"}), 404
    result = [rapport.to_dict() for rapport in rapports]
    return jsonify(result), 200

@token_required
@role_required("directeur")
def get_all_rapports(current_user):
    """Get all rapports - only accessible by directors"""
    try:
        rapports = Rapport.query.all()
        result = [rapport.to_dict() for rapport in rapports]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@token_required
@role_required("technicien", "directeur")
def get_rapport(id, current_user):
    rapport = Rapport.query.get(id)
    if not rapport:
        return jsonify({"message": "Rapport non trouvé"}), 404
    return jsonify(rapport.to_dict()), 200

@token_required
@role_required("directeur")
def update_rapport(id):
    data = request.get_json()
    desctripion = data.get("description")
    id_serre = data.get("id_serre")
    id_bilans = data.get("ids_bilans", [])
    date_debut_str = data.get("date_debut")
    date_fin_str = data.get("date_fin")
    if date_debut_str:
        try:
            date_debut = datetime.strptime(date_debut_str, "%d/%m/%Y %H:%M")
        except ValueError:
            return jsonify({"message": "Format de date de début invalide, attendu YYYY-MM-DDTHH:MM"}), 400
    else:
        date_debut = None

    if date_fin_str:
        try:
            date_fin = datetime.strptime(date_fin_str, "%d/%m/%Y %H:%M")
        except ValueError:
            return jsonify({"message": "Format de date de fin invalide, attendu YYYY-MM-DDTHH:MM"}), 400
    

    if not desctripion:
        return jsonify({"message": "Champs requis manquants"}), 400
    rapport = Rapport.query.get(id)
    if not rapport:
        return jsonify({"message": "Rapport non trouvé"}), 404
    rapport.description = desctripion
    rapport.id_serre = id_serre
    rapport.id_bilans = id_bilans
    if date_debut:
        rapport.date_debut = date_debut
    if date_fin:
        rapport.date_fin = date_fin
    # Mettre à jour le rapport en base de données
    db.session.commit()
    return jsonify({"message": "Rapport mis à jour avec succès"}), 200


@token_required
@role_required("directeur")
def delete_rapport(id, current_user):
    """Delete a rapport - only accessible by directors"""
    try:
        rapport = Rapport.query.get(id)
        if not rapport:
            return jsonify({"message": "Rapport non trouvé"}), 404
        
        # Delete the PDF file if it exists
        if rapport.lien_pdf:
            try:
                pdf_path = os.path.join("app", rapport.lien_pdf)
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)
            except Exception as e:
                print(f"Warning: Could not delete PDF file: {e}")
        
        db.session.delete(rapport)
        db.session.commit()
        return jsonify({"message": "Rapport supprimé avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


def generer_pdf_rapport(description, nom, id_serre, output_path, etat_bilan, alertes):
    html = render_template(
        "rapport_template.html",
        description=description,
        user_name=nom,
        id_serre=id_serre,
        date=datetime.now().strftime('%Y-%m-%d %H:%M'),
        etat_bilan=etat_bilan,
        alertes=alertes
    )
    HTML(string=html).write_pdf(output_path)


@token_required
@role_required("directeur")
def get_rapports_by_director_entreprise(current_user):
    try:
        query = """
            SELECT 
                r.id,
                r.date,
                r.description,
                r.lien_pdf,
                s.nom AS serre_nom,
                s.id AS serre_id,
                d.nom AS domaine_nom,
                e.nom AS entreprise_nom,
                u.name AS user_nom
            FROM rapport r
            JOIN serres s ON r.id_serre = s.id
            JOIN domaines d ON s.id_domaine = d.id
            JOIN entreprises e ON d.id_entreprise = e.id
            JOIN users u ON r.user_id = u.id
            WHERE e.id_user = :user_id
            ORDER BY r.date DESC
        """
        result = db.session.execute(text(query), {"user_id": current_user.id})

        rapports = []
        for row in result.mappings():
            # Récupérer les bilans de la serre liée (le modèle ne stocke pas les bilans spécifiques au rapport)
            try:
                bilans_for_serre = Bilan.query.filter_by(id_serre=row["serre_id"]).all()
                bilan_names = [b.nom for b in bilans_for_serre]
            except Exception:
                bilan_names = []

            rapports.append({
                "id": row["id"],
                "date": row["date"].isoformat() if row["date"] else None,
                "description": row["description"],
                "lien_pdf": row["lien_pdf"],
                "serre_nom": row["serre_nom"],
                "serre_id": row["serre_id"],
                "domaine_nom": row["domaine_nom"],
                "entreprise_nom": row["entreprise_nom"],
                "user_nom": row["user_nom"],
                "bilans": bilan_names,
            })

        return jsonify(rapports), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@token_required
@role_required("technicien", "technicien_superieur", "directeur")
def get_rapports_by_assigned_serres(current_user):
    """Get reports for serres assigned to the technician"""
    try:
        if current_user.role == "directeur":
            return get_rapports_by_director_entreprise(current_user)
        elif current_user.role in ["technicien", "technicien_superieur"]:
            # Get assigned serres for the technician
            autorisations = Autorisation_serre.query.filter_by(id_user=current_user.id).all()
            assigned_serre_ids = [auth.id_serre for auth in autorisations]
            
            if not assigned_serre_ids:
                return jsonify([]), 200
            
            # Get reports for assigned serres
            rapports = Rapport.query.filter(Rapport.id_serre.in_(assigned_serre_ids)).order_by(Rapport.date.desc()).all()
            
            # Enhance report data with serre and domaine information
            enhanced_rapports = []
            for rapport in rapports:
                enhanced_rapport = rapport.to_dict()
                
                # Get serre information
                serre = db.session.query(Serre).filter_by(id=rapport.id_serre).first()
                if serre:
                    enhanced_rapport['serre_nom'] = serre.nom
                    enhanced_rapport['serre_id'] = serre.id
                    
                    # Get domaine information
                    domaine = db.session.query(Domaine).filter_by(id=serre.id_domaine).first()
                    if domaine:
                        enhanced_rapport['domaine_nom'] = domaine.nom
                        
                        # Get entreprise information
                        entreprise = db.session.query(Entreprise).filter_by(id=domaine.id_entreprise).first()
                        if entreprise:
                            enhanced_rapport['entreprise_nom'] = entreprise.nom
                
                # Get user information
                user = User.query.get(rapport.user_id)
                if user:
                    enhanced_rapport['user_nom'] = user.name
                
                enhanced_rapports.append(enhanced_rapport)
            
            return jsonify(enhanced_rapports), 200
        else:
            return jsonify({"status": "error", "message": "Rôle non autorisé"}), 403
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


