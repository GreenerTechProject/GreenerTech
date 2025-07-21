from flask import request, jsonify
from app.models.serre import Serre
from app.models.domaine import Domaine
from app.models.points_gps import GroupCor
from app.models.entreprise import Entreprise
from database.config import db
from sqlalchemy import func
from app.utils.security import token_required, role_required
from app.models.bilan import Bilan

@token_required
@role_required("directeur" , "technicien_superieur")
def create_serre(current_user):
    data = request.get_json()

    domaine = Domaine.query.get(data.get('id_domaine'))
    if not domaine:
        return jsonify({"message": "Domaine non trouvé"}), 404

    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    last_id_group_cor = db.session.query(func.max(GroupCor.id_group_cor)).scalar() or 0
    id_group_cor = last_id_group_cor + 1

    gps_points = data.get('position', [])
    if not gps_points:
        return jsonify({"message": "Points GPS requis"}), 400

    for point in gps_points:
        gc = GroupCor(
            id_group_cor=id_group_cor,
            point_x=point['latitude'],
            point_y=point['longitude'],
            ordre=point.get('ordre', 0)
        )
        db.session.add(gc)

    serre = Serre(
        nom=data['nom'],
        id_group_cor=id_group_cor,
        id_domaine=domaine.id
    )
    db.session.add(serre)
    db.session.commit()

    return jsonify(serre.to_dict()), 201


@token_required
@role_required("directeur" , "technicien_superieur")
def get_all_serres(current_user):
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise associée"}), 404

    domaines = Domaine.query.filter_by(id_entreprise=entreprise.id).all()
    domaine_ids = [d.id for d in domaines]
    serres = Serre.query.filter(Serre.id_domaine.in_(domaine_ids)).all()

    return jsonify([s.to_dict() for s in serres]), 200


@token_required
@role_required("directeur" , "technicien_superieur")
def get_serre(current_user, id):
    serre = Serre.query.get_or_404(id)
    domaine = Domaine.query.get(serre.id_domaine)
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    return jsonify(serre.to_dict()), 200


@token_required
@role_required("directeur" , "technicien_superieur")
def update_serre(current_user, id):
    serre = Serre.query.get_or_404(id)
    domaine = Domaine.query.get(serre.id_domaine)
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()

    serre.nom = data.get('nom', serre.nom)
    gps_points = data.get('position')
    if gps_points:
        GroupCor.query.filter_by(id_group_cor=serre.id_group_cor).delete()
        for point in gps_points:
            new_point = GroupCor(
                id_group_cor=serre.id_group_cor,
                point_x=point['latitude'],
                point_y=point['longitude'],
                ordre=point.get('ordre', 0)
            )
            db.session.add(new_point)

    db.session.commit()
    return jsonify(serre.to_dict()), 200


@token_required
@role_required("directeur" , "technicien_superieur")
def delete_serre(current_user, id):
    serre = Serre.query.get_or_404(id)
    domaine = Domaine.query.get(serre.id_domaine)
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    GroupCor.query.filter_by(id_group_cor=serre.id_group_cor).delete()
    db.session.delete(serre)
    db.session.commit()

    return jsonify({"message": "Serre supprimée"}), 200


@token_required
@role_required("directeur" , "technicien_superieur")
def get_bilans_by_serre(current_user, id_serre):
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise associée"}), 404

    # Vérifier que la serre existe et appartient bien à l'entreprise
    serre = Serre.query.get_or_404(id_serre)
    domaine = Domaine.query.get(serre.id_domaine)
    if not domaine or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    bilans = Bilan.query.filter_by(id_serre=id_serre).all()
    return jsonify([b.to_dict() for b in bilans]), 200



