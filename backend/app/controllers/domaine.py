from flask import request, jsonify
from app.models.domaine import Domaine
from app.models.points_gps import GroupCor
from database.config import db
from app.utils.security import token_required, role_required
from app.models.entreprise import Entreprise
import time

@token_required
@role_required("directeur")
def create_domaine(current_user):
    data = request.get_json()

    # Récupérer entreprise liée au directeur connecté
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise associée à cet utilisateur"}), 404

    # Générer un id_group_cor unique (timestamp par exemple)
    import random
    id_group_cor = int(time.time() * 1000) + random.randint(1, 999)


    gps_points = data.get('position', [])
    if not gps_points:
        return jsonify({"message": "Veuillez fournir une liste de points GPS"}), 400

    # Créer chaque point group_cor
    for point in gps_points:
        gc = GroupCor(
            id_group_cor=id_group_cor,
            point_x=point['latitude'],
            point_y=point['longitude'],
            ordre=point.get('ordre', 0)
        )
        db.session.add(gc)

    # Créer le domaine
    domaine = Domaine(
        nom=data['nom'],
        id_group_cor=id_group_cor,
        id_entreprise=entreprise.id
    )
    db.session.add(domaine)
    db.session.commit()

    return jsonify({"message": "Domaine et points GPS créés", "domaine": domaine.to_dict()}), 201


@token_required
@role_required("directeur")
def get_all_domaines(current_user):
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise associée"}), 404

    domaines = Domaine.query.filter_by(id_entreprise=entreprise.id).all()
    return jsonify([d.to_dict() for d in domaines]), 200

@token_required
@role_required("directeur")
def get_domaine(current_user, id):
    domaine = Domaine.query.get_or_404(id)
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé à accéder à ce domaine"}), 403

    return jsonify(domaine.to_dict()), 200

@token_required
@role_required("directeur")
def update_domaine(current_user, id):
    domaine = Domaine.query.get_or_404(id)
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()
    domaine.nom = data.get('nom', domaine.nom)

    gps_points = data.get('gps_points')
    if gps_points:
        # Supprimer les anciens points liés
        GroupCor.query.filter_by(id_group_cor=domaine.id_group_cor).delete()

        for point in gps_points:
            new_point = GroupCor(
                id_group_cor=domaine.id_group_cor,
                point_x=point['point_x'],
                point_y=point['point_y'],
                ordre=point.get('ordre', 0)
            )
            db.session.add(new_point)

    db.session.commit()
    return jsonify({"message": "Domaine mis à jour", "domaine": domaine.to_dict()}), 200


@token_required
@role_required("directeur")
def delete_domaine(current_user, id):
    domaine = Domaine.query.get_or_404(id)
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    GroupCor.query.filter_by(id_group_cor=domaine.id_group_cor).delete()
    db.session.delete(domaine)
    db.session.commit()
    
    return jsonify({"message": "Domaine supprimé"}), 200
