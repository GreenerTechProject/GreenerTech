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
    id_bilan = data.get("ids_bilans", [])

    # Récupérer les dates de début et fin (au format string ISO "YYYY-MM-DD")
    date_debut_str = data.get("date_debut")
    date_fin_str = data.get("date_fin")

    if not description or not id_serre:
        return jsonify({"message": "Champs requis manquants"}), 400

    # Convertir les dates en objets datetime.date si présentes
    date_debut = None
    date_fin = None
    try:
        if date_debut_str:
            date_debut = datetime.strptime(date_debut_str, "%d/%m/%Y %H:%M")
        if date_fin_str:
            date_fin = datetime.strptime(date_fin_str, "%d/%m/%Y %H:%M")
    except ValueError:
        return jsonify({"message": "Format de date invalide, attendu YYYY-MM-DDTHH:MM"}), 400

    # Construire la requête pour récupérer les derniers états de bilan
    query_etat = Etat_bilan.query.filter(Etat_bilan.id_bilan.in_(id_bilan))
    if date_debut:
        query_etat = query_etat.filter(Etat_bilan.date >= date_debut)
    if date_fin:
        query_etat = query_etat.filter(Etat_bilan.date <= date_fin)
    etat_bilan = query_etat.order_by(Etat_bilan.date.desc()).all()

    # Filtrer les alertes par date aussi
    query_alertes = Alerte.query.filter(Alerte.id_bilan.in_(id_bilan))
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
                e.nom AS entreprise_nom
            FROM rapport r
            JOIN serres s ON r.id_serre = s.id
            JOIN domaines d ON s.id_domaine = d.id
            JOIN entreprises e ON d.id_entreprise = e.id
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
                "serre": row["serre_nom"],
                "serre_id": row["serre_id"],
                "domaine": row["domaine_nom"],
                "entreprise": row["entreprise_nom"],
                "bilans": bilan_names,
            })

        return jsonify(rapports), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


