from flask import request, jsonify
from app.models.mission_robot import MissionRobot
from database.config import db
from app.utils.security import token_required, role_required
from datetime import datetime

@token_required
@role_required("directeur", "technicien_superieur", "technicien")
def create_mission_robot(current_user):
    data = request.get_json()
    try:
        id_robot = data['id_robot']
        id_serre = data['id_serre']
        rep_jr = data.get('rep_jr', 0)
        rep_sem = data.get('rep_sem')
        jour = data.get('jour')
        heure = data.get('heure')
        minute = data.get('minute')
        date_debut = data.get('date_debut')
        date_fin = data.get('date_fin')
        executed = data.get('executed')
        bilans = data.get('bilans', [])

        if date_debut:
            date_debut = datetime.fromisoformat(date_debut)
        else:
            date_debut = None
        

        mission = MissionRobot(
        id_robot=id_robot,
        id_serre=id_serre,
        rep_jr=rep_jr,
        rep_sem=rep_sem,
        jour = jour , # 'lundi'=1 , 'mardi'=2, etc.
        heure = heure , 
        minute = minute,
        date_debut=date_debut,
        date_fin=date_fin,
        executed=executed,
        bilans=bilans # <-- récupérer la liste de bilans

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
@role_required("directeur", "technicien_superieur", "technicien")
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
        mission.jour = data.get('jour', mission.jour) , # 'lundi'=1 , 'mardi'=2, etc.
        mission.heure = data.get('heure' ,mission.heure) , 
        mission.minute = data.get('minute' ,mission.minute) ,
        mission.date_debut = data.get('date_debut', mission.date_debut)
        mission.date_fin = data.get('date_fin', mission.date_fin)
        mission.executed = data.get('executed', mission.executed)
        mission.bilans = data.get('bilans', mission.bilans)

        # Si tu as d'autres champs à ajouter, complète ici

        db.session.commit()
        return jsonify(mission.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400



@token_required
@role_required("directeur", "technicien_superieur", "technicien")
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
