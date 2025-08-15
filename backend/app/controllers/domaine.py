from flask import request, jsonify
from app.models.domaine import Domaine
from app.models.points_gps import GroupCor
from database.config import db
from app.utils.security import token_required, role_required
from app.models.entreprise import Entreprise
from sqlalchemy import func
from app.models.serre import Serre
from sqlalchemy.exc import IntegrityError
from app.models.autorisation_domaine import Autorisation_domaine
from app.models.bilan import Bilan
from app.models.alerte import Alerte
from app.models.autorisation_bilan import Autorisation_bilan
from app.models.etat_bilan import Etat_bilan
from app.models.guide_culture import GuideCulture
from app.models.intervention import Intervention
from app.models.notification import Notification
from app.models.mission_robot import MissionRobot
from app.models.autorisation_serre import Autorisation_serre

@token_required
@role_required("directeur")
def create_domaine(current_user):
    data = request.get_json()

    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise associée à cet utilisateur"}), 404

    name = data.get('nom')
    area = data.get('surface')
    center = data.get('center')
    path = data.get('position')

    if not name or not area or not center or not path:
        return jsonify({"message": "Les champs name, area, center et path sont obligatoires"}), 400


    # Récupérer le dernier id_group_cor existant (max)
    last_id_group_cor = db.session.query(func.max(GroupCor.id_group_cor)).scalar()
    if last_id_group_cor is None:
        last_id_group_cor = 0  # si pas encore d'enregistrement

    id_group_cor = last_id_group_cor + 1


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
        
        
    domaine = Domaine(
        nom=name,
        id_group_cor=id_group_cor,
        surface=area,
        center_lat=center.get('latitude'),
        center_lng=center.get('longitude'),
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
@role_required("directeur", "technicien_superieur", "technicien")
def get_all_domaines(current_user):
    entreprise = None

    if getattr(current_user, 'role', None) == 'directeur':
        entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    else:
        # First try direct entreprise link
        if getattr(current_user, 'id_entreprise', None):
            entreprise = Entreprise.query.filter_by(id=current_user.id_entreprise).first()
        # Fallback: use assigned director
        if not entreprise and getattr(current_user, 'id_assigned', None):
            from app.models.user import User
            director = User.query.get(current_user.id_assigned)
            if director:
                entreprise = Entreprise.query.filter_by(id_user=director.id).first()

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

    domaine.nom = data.get('nom', domaine.nom)
    domaine.surface = data.get('surface', domaine.surface)

    center = data.get('center')
    if center:
        domaine.center_lat = center.get('longitude', domaine.center_lat)
        domaine.center_lng = center.get('longitude', domaine.center_lng)

    path = data.get('position')
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

    try:
        db.session.rollback()
    except Exception:
        pass

    try:
        Autorisation_domaine.query.filter_by(id_domaine=domaine.id).delete()
        db.session.flush()       

        serres = Serre.query.filter_by(id_domaine=domaine.id).all()
        for s in serres:
            # Remove autorisations for this serre
            Autorisation_serre.query.filter_by(id_serre=s.id).delete()
            db.session.flush()

            # Remove bilans and their dependents
            bilans = Bilan.query.filter_by(id_serre=s.id).all()
            for b in bilans:
                Alerte.query.filter_by(id_bilan=b.id).delete()
                Autorisation_bilan.query.filter_by(id_bilan=b.id).delete()
                Etat_bilan.query.filter_by(id_bilan=b.id).delete()
                GroupCor.query.filter_by(id_group_cor=b.id_group_cor).delete()
                db.session.delete(b)

            # Delete guides, interventions (with notifications), missions
            GuideCulture.query.filter_by(id_serre=s.id).delete()
            interventions = Intervention.query.filter_by(id_serre=s.id).all()
            for iv in interventions:
                Notification.query.filter_by(id_intervention=iv.id).delete()
                db.session.delete(iv)
            MissionRobot.query.filter_by(id_serre=s.id).delete()

            # Delete serre geometry and the serre itself
            GroupCor.query.filter_by(id_group_cor=s.id_group_cor).delete()
            db.session.delete(s)

        # 3) Delete associated group coordinates and then the domaine
        GroupCor.query.filter_by(id_group_cor=domaine.id_group_cor).delete()
        db.session.delete(domaine)
        db.session.commit()

        return jsonify({"message": "Domaine supprimé"}), 200
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({
            "message": "Impossible de supprimer le domaine: des éléments y sont encore liés",
            "detail": str(e)
        }), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Delete failed: {str(e)}"}), 500


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

