from flask import request, jsonify
from app.models.serre import Serre
from app.models.domaine import Domaine
from app.models.points_gps import GroupCor
from app.models.entreprise import Entreprise
from database.config import db
from sqlalchemy import func
from app.utils.security import token_required, role_required, access_domaine_required
from app.models.bilan import Bilan
from app.models.guide_culture import GuideCulture
from app.models.alerte import Alerte
from app.models.autorisation_bilan import Autorisation_bilan
from app.models.autorisation_serre import Autorisation_serre
from app.models.etat_bilan import Etat_bilan
from app.models.intervention import Intervention
from app.models.notification import Notification
from app.models.mission_robot import MissionRobot


@token_required
@role_required("directeur" , "technicien_superieur")
def create_serre(current_user):
    data = request.get_json()

    domaine = Domaine.query.get(data.get('id_domaine'))
    if not domaine:
        return jsonify({"message": "Domaine non trouvé"}), 404

    entreprise = Entreprise.query.filter_by(id=current_user.id_entreprise).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    last_id_group_cor = db.session.query(func.max(GroupCor.id_group_cor)).scalar() or 0
    id_group_cor = last_id_group_cor + 1

    gps_points = data.get('position', [])
    if not gps_points:
        return jsonify({"message": "Points GPS requis"}), 400

    for point in gps_points:
        # Accept both {lat,lng} and {latitude,longitude}
        lat = point.get('latitude')
        lng = point.get('longitude')
        if lat is None or lng is None:
            return jsonify({"message": "Chaque point doit contenir lat/lng ou latitude/longitude"}), 400

        gc = GroupCor(
            id_group_cor=id_group_cor,
            point_x=lat,
            point_y=lng,
            ordre=point.get('ordre', 0)
        )
        db.session.add(gc)

    serre = Serre(
        nom=data['nom'],
        surface = data.get('surface'),
        center_lat=data.get('center', {}).get('latitude') if data.get('center') else None,
        center_lng=data.get('center', {}).get('longitude') if data.get('center') else None,
        id_group_cor=id_group_cor,
        id_domaine=domaine.id
    )
    db.session.add(serre)
    
    
    db.session.flush()  # permet d'avoir domaine.id sans commit
    
    # Créer l'autorisation pour le directeur qui a créé le domaine
    autorisation = Autorisation_serre(
        id_user=current_user.id,
        id_serre=serre.id
    )
    db.session.add(autorisation)
    
    db.session.commit()

    return jsonify(serre.to_dict()), 201


@token_required
@role_required("directeur" , "technicien_superieur", "technicien")
#@access_domaine_required
def get_all_serres(current_user):
    entreprise = Entreprise.query.filter_by(id=current_user.id_entreprise).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise associée"}), 404

    domaines = Domaine.query.filter_by(id_entreprise=entreprise.id).all()
    domaine_ids = [d.id for d in domaines]
    serres = Serre.query.filter(Serre.id_domaine.in_(domaine_ids)).all()

    return jsonify([s.to_dict() for s in serres]), 200


@token_required
@role_required("directeur" , "technicien_superieur", "technicien")
#@access_domaine_required
def get_serre(current_user, id):
    serre = Serre.query.get_or_404(id)
    domaine = Domaine.query.get(serre.id_domaine)
    entreprise = Entreprise.query.filter_by(id=current_user.id_entreprise).first()
    # Allow technicien_superieur if explicit autorisation exists
    from app.models.autorisation_serre import Autorisation_serre
    if getattr(current_user, "role", None) == "technicien_superieur":
        auth = Autorisation_serre.query.filter_by(id_user=current_user.id, id_serre=serre.id).first()
        if auth:
            return jsonify(serre.to_dict()), 200

    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    return jsonify(serre.to_dict()), 200


@token_required
@role_required("directeur" , "technicien_superieur")
@access_domaine_required
def update_serre(current_user, id):
    serre = Serre.query.get_or_404(id)
    domaine = Domaine.query.get(serre.id_domaine)
    entreprise = Entreprise.query.filter_by(id=current_user.id_entreprise).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()

    serre.nom = data.get('nom', serre.nom)
    serre.surface = data.get('surface', serre.surface)

    center = data.get('center')
    if center:
        serre.center_lat = center.get('latitude', serre.center_lat)
        serre.center_lng = center.get('longitude', serre.center_lng)
        
    gps_points = data.get('position')
    if gps_points:
        GroupCor.query.filter_by(id_group_cor=serre.id_group_cor).delete()
        for point in gps_points:
            # Accept both {lat,lng} and {latitude,longitude}
            lat = point.get('latitude')
            lng = point.get('longitude')
            if lat is None or lng is None:
                return jsonify({"message": "Chaque point doit contenir latitude/longitude"}), 400
                
            new_point = GroupCor(
                id_group_cor=serre.id_group_cor,
                point_x=lat,
                point_y=lng,
                ordre=point.get('ordre', 0)
            )
            db.session.add(new_point)

    db.session.commit()
    return jsonify(serre.to_dict()), 200


@token_required
@role_required("directeur" , "technicien_superieur")
@access_domaine_required
def delete_serre(current_user, id):
    serre = Serre.query.get_or_404(id)
    domaine = Domaine.query.get(serre.id_domaine)
    entreprise = Entreprise.query.filter_by(id=current_user.id_entreprise).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Non autorisé"}), 403

    # Ensure we start with a clean transaction
    try:
        db.session.rollback()
    except Exception:
        pass

    try:
        # Remove autorisations that reference this serre to satisfy FK constraints
        try:
            Autorisation_serre.query.filter_by(id_serre=serre.id).delete()
        except Exception:
            pass

        # Remove bilans that are attached to this serre (and their coordinates)
       
        bilans = Bilan.query.filter_by(id_serre=serre.id).all()
        for b in bilans:
            # Delete alerts referencing this bilan first to satisfy FK alertes.id_bilan -> bilans.id
            Alerte.query.filter_by(id_bilan=b.id).delete()
            # Delete autorisations referencing this bilan to satisfy FK autorisations_bilan.id_bilan -> bilans.id
            Autorisation_bilan.query.filter_by(id_bilan=b.id).delete()
            # Delete etat_bilans referencing this bilan
            Etat_bilan.query.filter_by(id_bilan=b.id).delete()
            # Then delete the bilan's coordinates and the bilan itself
            GroupCor.query.filter_by(id_group_cor=b.id_group_cor).delete()
            db.session.delete(b)

        # Delete culture guides linked to this serre
        GuideCulture.query.filter_by(id_serre=serre.id).delete()

        # Delete interventions linked to this serre (and notifications referencing them)
        interventions = Intervention.query.filter_by(id_serre=serre.id).all()
        for iv in interventions:
            Notification.query.filter_by(id_intervention=iv.id).delete()
            db.session.delete(iv)

        # Delete robot missions linked to this serre
        MissionRobot.query.filter_by(id_serre=serre.id).delete()

        GroupCor.query.filter_by(id_group_cor=serre.id_group_cor).delete()
        db.session.delete(serre)
        db.session.commit()

        return jsonify({"message": "Serre supprimée"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Delete failed: {str(e)}"}), 500


@token_required
@role_required("directeur", "technicien_superieur", "technicien")
def get_bilans_by_serre(current_user, id_serre):  
    entreprise = Entreprise.query.filter_by(id=current_user.id_entreprise).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise associée"}), 404

    # Vérifier que la serre existe
    serre = Serre.query.get_or_404(id_serre)    
    # Pour les techniciens, vérifier l'autorisation d'accès à la serre
    if current_user.role == "technicien":
        auth = Autorisation_serre.query.filter_by(id_user=current_user.id, id_serre=id_serre).first()
        if not auth :
            return jsonify({"message": "Accès non autorisé à cette serre"}), 403
    else:
        domaine = Domaine.query.get(serre.id_domaine)
        if not domaine or domaine.id_entreprise != entreprise.id:
            return jsonify({"message": "Non autorisé"}), 403

    bilans = Bilan.query.filter_by(id_serre=id_serre).all()
    return jsonify([b.to_dict() for b in bilans]), 200

@token_required
@role_required("technicien", "technicien_superieur", "directeur")
def get_guides_by_serre(current_user, id_serre):
    serre = Serre.query.get(id_serre)
    if not serre:
        return jsonify({"message": "Serre introuvable"}), 404

    # Cas spécifique : technicien doit avoir accès à la serre
    # if current_user.role == "technicien":
    #     autorisation = Autorisation.query.filter_by(id=current_user.id_entreprise, id_serre=id_serre).first()
    #     if not autorisation or not autorisation.access_serre:
    #         return jsonify({"message": "Accès non autorisé à cette serre"}), 403

    guides = GuideCulture.query.filter_by(id_serre=id_serre).all()
    return jsonify([g.to_dict() for g in guides]), 200


@token_required
@role_required("technicien", "technicien_superieur", "directeur")
def get_serres_by_user(current_user):
    # Get all autorisations for the current user
    autorisations = Autorisation_serre.query.filter_by(id_user=current_user.id).all()
    
    if not autorisations:
        return jsonify([]), 200
    
    # Get serre IDs from autorisations
    serre_ids = [auth.id_serre for auth in autorisations]
    
    # Get serre details
    serres = Serre.query.filter(Serre.id.in_(serre_ids)).all()
    
    # Get domain information for each serre
    serres_data = []
    for serre in serres:
        domaine = Domaine.query.get(serre.id_domaine)
        serre_dict = serre.to_dict()
        if domaine:
            serre_dict['domaine_nom'] = domaine.nom
        serres_data.append(serre_dict)
    
    return jsonify(serres_data), 200


