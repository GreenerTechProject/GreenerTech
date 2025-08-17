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

        if date_debut and (rep_jr or rep_sem):
            return jsonify({"status": "error", "message": "Vous ne pouvez pas sélectionner la date et la répétition en même temps."}), 400

        mission = MissionRobot(
        id_robot=id_robot,
        id_serre=id_serre,
        rep_jr=rep_jr,
        rep_sem=rep_sem,
        # Don't set date_debut here - it will be set conditionally below
        # date_debut=date_debut,
        date_fin=date_fin,
        executed=executed,
        bilans=bilans # <-- récupérer la liste de bilans
        )
        
        # Set date_debut based on mission type
        if date_debut and not (rep_jr or rep_sem):
            # Date-based mission
            mission.date_debut = date_debut
            mission.jour = None
            mission.heure = None
            mission.minute = None
        else:
            # Repetition-based mission
            mission.date_debut = None
            
        if rep_sem and rep_sem!=0 :
            if not jour or not heure or not minute:
                return jsonify({"status": "error", "message": "Vous devez sélectionner un jour, une heure et une minute pour la répétition hebdomadaire."}), 400
            else:
                mission.jour = jour
                mission.heure = heure
                mission.minute = minute

        if rep_jr and rep_jr!=0 :
            if  not heure or not minute:
                return jsonify({"status": "error", "message": "Vous devez sélectionner  une heure et une minute pour la répétition hebdomadaire."}), 400
            else:
                mission.heure = heure
                mission.minute = minute
            
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
    date_debut = data.get('date_debut')
    rep_jr = data.get('rep_jr' , 0)  # Default to 0 if not provided
    rep_sem = data.get('rep_sem' , 0)  # Default to 0 if not provided
    jour = data.get('jour' , None)  # Default to None if not provided
    heure = data.get('heure' , None)  # Default to None if not provided
    minute = data.get('minute' , None)  # Default to None if not provided

    if date_debut and (rep_jr or rep_sem):
        return jsonify({"status": "error", "message": "Vous ne pouvez pas sélectionner la date et la répétition en même temps."}), 400
    if rep_sem and rep_sem!=0 :
        mission.date_debut = None  
        if not jour or not heure or not minute:
            return jsonify({"status": "error", "message": "Vous devez sélectionner un jour, une heure et une minute pour la répétition hebdomadaire."}), 400
        else:
            mission.jour =  jour, # 'lundi'=1 , 'mardi'=2, etc.
            mission.heure = heure , 
            mission.minute = minute ,
    
    if rep_jr and rep_jr!=0 :
        mission.date_debut = None
        if  not heure or not minute:
            return jsonify({"status": "error", "message": "Vous devez sélectionner  une heure et une minute pour la répétition hebdomadaire."}), 400
        else:
            mission.heure = heure , 
            mission.minute = minute ,
    if date_debut:
        mission.date_debut = date_debut
        mission.jour =  None, # 'lundi'=1 , 'mardi'=2, etc.
        mission.heure = None , 
        mission.minute = None ,

    try:
        mission.id_robot = data.get('id_robot', mission.id_robot)
        mission.id_serre = data.get('id_serre', mission.id_serre)
        mission.rep_jr = rep_jr 
        mission.rep_sem = rep_sem

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
