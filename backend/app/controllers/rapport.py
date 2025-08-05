from flask import request, jsonify, render_template
from app.models.rapport import Rapport
from app.models.user import User
from app.utils.security import token_required, role_required
from database.config import db
from weasyprint import HTML
from datetime import datetime, date
import os
import uuid
from  app.models.alerte import Alerte  
from app.models.etat_bilan import Etat_bilan  # Assure-toi que c'est bien importé

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



@token_required
@role_required("technicien", "directeur")
def create_rapport(current_user):
    data = request.get_json()
    description = data.get("description")
    id_serre = data.get("id_serre")
    # recuperer tous les id des bilans conserner ou ce rapport
    id_bilan = data.get("ids_bilans", [])
    # recuperer seulement la dernier etat de  chaque bilan dans la table d'etat_bilan
    etat_bilan = Etat_bilan.query.filter(Etat_bilan.id_bilan.in_(id_bilan)).order_by(Etat_bilan.date.desc()).all()
    # etat_bilan = Etat_bilan.query.filter(Etat_bilan.id_bilan.in_(id_bilan)).all()
    # recuperer les alertes conserner par ce rapport
    alertes = Alerte.query.filter(Alerte.id_bilan.in_(id_bilan)).all()


    if not description or not id_serre:
        return jsonify({"message": "Champs requis manquants"}), 400

    # Créer le dossier des rapports s’il n'existe pas
    output_dir = "app/static/rapports"
    os.makedirs(output_dir, exist_ok=True)

    # Nom unique du PDF
    nom_pdf = f"rapport_{uuid.uuid4().hex}.pdf"
    chemin_pdf = os.path.join(output_dir, nom_pdf)
    # recuperer le nom de technicien de current_user
    user = User.query.get(current_user.id)
    nom_user=user.name
    # Génération du PDF via HTML
    generer_pdf_rapport(description, nom_user, id_serre, chemin_pdf, etat_bilan, alertes)
    # Création du rapport en BDD
    rapport = Rapport(
        description=description,
        lien_pdf="static/rapports/"+nom_pdf,
        id_serre=id_serre,
        user_id=current_user.id,
        date=date.today()
    )
    db.session.add(rapport)
    db.session.commit()

    return jsonify(rapport.to_dict()), 201



@token_required
@role_required("technicien", "directeur")
def get_all_rapports(current_user):
    rapports = Rapport.query.all()
    result = [rapport.to_dict() for rapport in rapports]
    return jsonify(result), 200

@token_required
@role_required("technicien", "directeur")
def get_rapport(id, current_user):
    rapport = Rapport.query.get(id)
    if not rapport:
        return jsonify({"message": "Rapport non trouvé"}), 404
    return jsonify(rapport.to_dict()), 200




# # update rapport
# @token_required
# @role_required("directeur")
# def update_rapport(id):
#     data = request.get_json()
#     desctripion = data.get("description")
#     if not desctripion:
#         return jsonify({"message": "Champs requis manquants"}), 400
#     rapport = Rapport.query.get(id)
#     if not rapport:
#         return jsonify({"message": "Rapport non trouvé"}), 404
#     rapport.description = desctripion
#     db.session.commit()
#     return jsonify({"message": "Rapport mis à jour avec succès"}), 200
# @token_required
# @role_required("directeur")
# def delete_rapport(id):
#     rapport = Rapport.query.get(id)
#     if not rapport:
#         return jsonify({"message": "Rapport non trouvé"}), 404
#     db.session.delete(rapport)
#     db.session.commit()
#     return jsonify({"message": "Rapport supprimé avec succès"}), 200

# update rapport
@token_required
@role_required("directeur")
def update_rapport(id):
    data = request.get_json()
    desctripion = data.get("description")
    if not desctripion:
        return jsonify({"message": "Champs requis manquants"}), 400
    rapport = Rapport.query.get(id)
    if not rapport:
        return jsonify({"message": "Rapport non trouvé"}), 404
    rapport.description = desctripion
    db.session.commit()
    return jsonify({"message": "Rapport mis à jour avec succès"}), 200

@token_required
@role_required("directeur")
def delete_rapport(id):
    rapport = Rapport.query.get(id)
    if not rapport:
        return jsonify({"message": "Rapport non trouvé"}), 404
    db.session.delete(rapport)
    db.session.commit()
    return jsonify({"message": "Rapport supprimé avec succès"}), 200




def generer_pdf_rapport(description, nom, id_serre, output_path, etats_bilan, alertes):
    html = render_template(
        "rapport_template.html",
        description=description,
        user_name=nom,
        id_serre=id_serre,
        date=datetime.now().strftime('%Y-%m-%d %H:%M'),
        etats_bilan=etats_bilan,
        alertes=alertes
    )
    HTML(string=html).write_pdf(output_path)


# from flask import  request, jsonify
# from app.models.rapport import Rapport
# from app.utils.security import token_required, role_required
# from database.config import db
# from fpdf import FPDF

# from datetime import date
# import os
# import uuid

# @token_required
# @role_required("technicien" , "directeur")
# def generer_rapport(current_user):
#     data = request.get_json()
#     description = data.get("description")
#     id_serre = data.get("id_serre")

#     if not description or not id_serre:
#         return jsonify({"message": "Champs requis manquants"}), 400

#     # Vérifier si le technicien a accès à cette serre (optionnel)
#     # autorisation = Autorisation.query.filter_by(id_user=current_user.id, id_serre=id_serre).first()
#     # if not autorisation or not autorisation.access_serre:
#     #     return jsonify({"message": "Non autorisé"}), 403

#     # Vérifie et crée le dossier s’il n’existe pas
#     output_dir = "static/rapports"
#     os.makedirs(output_dir, exist_ok=True)


#     # Générer un nom de fichier unique
#     nom_pdf = f"rapport_{uuid.uuid4().hex}.pdf"
#     chemin_pdf = os.path.join(output_dir, nom_pdf)

#     # Générer le PDF
#     generer_pdf_rapport(description=description, user=current_user.id, output_path=chemin_pdf)

#     # Créer le rapport en base
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




# def generer_pdf_rapport(description, user, output_path):
#     pdf = FPDF()
#     pdf.add_page()
#     pdf.set_font("Arial", size=12)

#     pdf.cell(200, 10, txt="Rapport Technique", ln=True, align="C")
#     pdf.ln(10)

#     pdf.cell(200, 10, txt=f"Rédigé par : {user}", ln=True)
#     pdf.cell(200, 10, txt=f"Description :", ln=True)
#     pdf.multi_cell(0, 10, txt=description)

#     pdf.output(output_path)








# # app/utils/pdf_generator.py
# # def generate_pdf(description, user_id, serre_id):
# #     # Créer un nom de fichier unique
# #     timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
# #     filename = f"rapport_{user_id}_{serre_id}_{timestamp}.pdf"
# #     file_path = os.path.join("storage", "rapports", filename)

# #     # Créer le dossier s'il n'existe pas
# #     os.makedirs(os.path.dirname(file_path), exist_ok=True)

# #     # Générer le contenu du PDF
# #     c = canvas.Canvas(file_path)
# #     c.setFont("Helvetica", 12)
# #     c.drawString(100, 800, "📋 Rapport d'intervention")
# #     c.drawString(100, 770, f"Date : {datetime.now().strftime('%Y-%m-%d %H:%M')}")
# #     c.drawString(100, 750, f"Serre ID : {serre_id}")
# #     c.drawString(100, 730, f"Technicien ID : {user_id}")

# #     # Description multi-ligne
# #     lines = description.split('\n')
# #     y = 700
# #     for line in lines:
# #         c.drawString(100, y, line)
# #         y -= 20

# #     c.save()
# #     return file_path
