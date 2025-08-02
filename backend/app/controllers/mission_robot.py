from flask import request, jsonify
from app.models.mission_robot import MissionRobot
from database.config import db
from app.utils.security import token_required, role_required

@token_required
@role_required("directeur", "technicien_superieur")
def create_mission_robot(current_user):
    data = request.get_json()
    try:
        mission = MissionRobot(
            id_robot=data['id_robot'],
            id_serre=data['id_serre'],
            rep_jr=data['rep_jr'],
            rep_sem=data['rep_sem'],
            date_debut=data.get('date_debut'),
            date_fin=data.get('date_fin'),
            executed=data.get('executed')
        )
        db.session.add(mission)
        db.session.commit()
        return jsonify(mission.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400


@token_required
def get_all_missions_robot(current_user):
    missions = MissionRobot.query.all()
    return jsonify([m.to_dict() for m in missions]), 200


@token_required
def get_mission_robot(current_user, mission_id):
    mission = MissionRobot.query.get(mission_id)
    if not mission:
        return jsonify({"status": "error", "message": "Mission introuvable"}), 404
    return jsonify(mission.to_dict()), 200
    
    
@token_required
@role_required("directeur", "technicien_superieur")
def update_mission_robot(current_user, mission_id):
    mission = MissionRobot.query.get(mission_id)
    if not mission:
        return jsonify({"status": "error", "message": "Mission introuvable"}), 404

    data = request.get_json()
    try:
        mission.id_robot = data.get('id_robot', mission.id_robot)
        mission.id_serre = data.get('id_serre', mission.id_serre)
        mission.rep_jr = data.get('rep_jr', mission.rep_jr)
        mission.rep_sem = data.get('rep_sem', mission.rep_sem)
        mission.date_debut = data.get('date_debut', mission.date_debut)
        mission.date_fin = data.get('date_fin', mission.date_fin)
        mission.executed = data.get('executed', mission.executed)

        # Si tu as d'autres champs à ajouter, complète ici

        db.session.commit()
        return jsonify(mission.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400



@token_required
@role_required("directeur", "technicien_superieur")
def delete_mission_robot(current_user, mission_id):
    mission = MissionRobot.query.get(mission_id)
    if not mission:
        return jsonify({"status": "error", "message": "Mission introuvable"}), 404
    try:
        db.session.delete(mission)
        db.session.commit()
        return jsonify({"status": "success", "message": "Mission supprimée"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400
