from flask import request, jsonify
from app.models.domaine import Domaine
from app.models.points_gps import GroupCor
from database.config import db
from app.utils.security import token_required, role_required
from app.models.entreprise import Entreprise
from sqlalchemy import func
from app.models.serre import Serre

@token_required
@role_required("directeur")
def create_domaine(current_user):
    data = request.get_json()

    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise associée à cet utilisateur"}), 404

    name = data.get('name')
    area = data.get('area')
    center = data.get('center')
    path = data.get('path')

    if not name or not area or not center or not path:
        return jsonify({"message": "Les champs name, area, center et path sont obligatoires"}), 400


    # Récupérer le dernier id_group_cor existant (max)
    last_id_group_cor = db.session.query(func.max(GroupCor.id_group_cor)).scalar()
    if last_id_group_cor is None:
        last_id_group_cor = 0  # si pas encore d'enregistrement

    id_group_cor = last_id_group_cor + 1


    gps_points = data.get('path', [])
    if not gps_points:
        return jsonify({"message": "Veuillez fournir une liste de points GPS"}), 400

    # Créer chaque point group_cor
    for point in gps_points:
        gc = GroupCor(
            id_group_cor=id_group_cor,
            point_x=point['lat'],
            point_y=point['lng'],
            ordre=point.get('ordre', 0)
        )
        db.session.add(gc)
        
        
    domaine = Domaine(
        nom=name,
        id_group_cor=id_group_cor,
        surface=area,
        center_lat=center.get('lat'),
        center_lng=center.get('lng'),
        #path=path,
        id_entreprise=entreprise.id
    )

    db.session.add(domaine)
    
    
    db.session.flush()  # permet d'avoir domaine.id sans commit
    
    # Créer l'autorisation pour le directeur qui a créé le domaine
    autorisation = Autorisation_domaine(
        id_user=current_user.id,
        id_domaine=domaine.id
    )
    db.session.add(autorisation)
    
    db.session.commit()

    return jsonify(domaine.to_dict()), 201


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
@token_required
@role_required("directeur")
def update_domaine(current_user, id):
    domaine = Domaine.query.get_or_404(id)
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()

    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()

    domaine.nom = data.get('name', domaine.nom)
    domaine.surface = data.get('area', domaine.surface)

    center = data.get('center')
    if center:
        domaine.center_lat = center.get('lat', domaine.center_lat)
        domaine.center_lng = center.get('lng', domaine.center_lng)

    path = data.get('path')
    if path:
        domaine.path = path

    db.session.commit()
    return jsonify(domaine.to_dict()), 200


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


@token_required
@role_required("directeur", "technicien_superieur")
def get_serres_by_domaine(current_user, id_domaine):
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise associée"}), 404

    domaine = Domaine.query.get_or_404(id_domaine)
    if domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    serres = Serre.query.filter_by(id_domaine=id_domaine).all()
    return jsonify([s.to_dict() for s in serres]), 200

