from flask import request, jsonify
from app.models.serre import Serre
# from app.models.domaine import Domaine
from app.models.CorSerre import CorSerre
from database.config import db
from app.utils.security import token_required, role_required
import time


# @token_required
# @role_required("directeur")
def create_serre(current_user):
    data = request.get_json()

    # Vérifier que le domaine existe et appartient à l'entreprise du directeur
    domaine = Domaine.query.get(data.get('id_domaine'))
    if not domaine:
        return jsonify({"message": "Domaine non trouvé"}), 404

    # Optionnel : vérifier que domaine appartient bien à l'entreprise du directeur
    # entreprise = ...
    # if domaine.id_entreprise != entreprise.id:
    #     return jsonify({"message": "Non autorisé"}), 403

    # Créer la serre
    serre = Serre(
        nom_serre=data.get('nom_serre'),
        date_creation=data.get('date_creation'),  # Assure-toi du format date
        id_domaine=domaine.id
    )
    db.session.add(serre)
    db.session.commit()

    # Créer les points cor_serre associés
    cor_points = data.get('cor_points', [])
    for point in cor_points:
        cor = CorSerre(
            id_serre=serre.id,
            point_x=point['point_x'],
            point_y=point['point_y'],
            ordre=point.get('ordre', 0)
        )
        db.session.add(cor)
    db.session.commit()

    return jsonify({"message": "Serre créée", "serre": serre.to_dict()}), 201


@token_required
@role_required("directeur")
def get_serres(current_user):
    # Récupérer toutes les serres du domaine(s) du directeur (simplifié ici)
    # Si tu souhaites filtrer selon entreprise/directeur, ajoute la logique

    serres = Serre.query.all()
    result = [serre.to_dict() for serre in serres]
    return jsonify(result), 200


# @token_required
# @role_required("directeur")
# def get_serre(current_user, id):
#     serre = Serre.query.get_or_404(id)
#     # Ici tu peux vérifier l'appartenance au domaine/entreprise comme avant

#     return jsonify(serre.to_dict()), 200


# @token_required
# @role_required("directeur")
# def update_serre(current_user, id):
#     serre = Serre.query.get_or_404(id)

#     data = request.get_json()

#     serre.nom_serre = data.get('nom_serre', serre.nom_serre)
#     serre.date_creation = data.get('date_creation', serre.date_creation)
#     # Si on peut changer de domaine
#     if 'id_domaine' in data:
#         domaine = Domaine.query.get(data['id_domaine'])
#         if not domaine:
#             return jsonify({"message": "Domaine non trouvé"}), 404
#         serre.id_domaine = domaine.id

#     # Mettre à jour les points cor_serre
#     cor_points = data.get('cor_points')
#     if cor_points is not None:
#         # Supprimer anciens points
#         CorSerre.query.filter_by(id_serre=serre.id).delete()
#         # Ajouter nouveaux points
#         for point in cor_points:
#             cor = CorSerre(
#                 id_serre=serre.id,
#                 point_x=point['point_x'],
#                 point_y=point['point_y'],
#                 ordre=point.get('ordre', 0)
#             )
#             db.session.add(cor)

#     db.session.commit()

#     return jsonify({"message": "Serre mise à jour", "serre": serre.to_dict()}), 200


# @token_required
# @role_required("directeur")
# def delete_serre(current_user, id):
#     serre = Serre.query.get_or_404(id)
#     db.session.delete(serre)
#     db.session.commit()
#     return jsonify({"message": "Serre supprimée"}), 200
