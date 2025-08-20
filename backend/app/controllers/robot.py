from flask import request, jsonify
from app.models.robot import Robot
from database.config import db
from app.utils.security import token_required, role_required

@token_required
@role_required("directeur")
def create_robot(current_user):
    data = request.get_json()
    
    # Validate required fields
    if not data.get('nom') or not data.get('referance'):
        return jsonify({"status": "error", "message": "Nom et référence sont requis"}), 400
    
    # Get the director's company ID
    if not current_user.id_entreprise:
        return jsonify({"status": "error", "message": "Directeur non associé à une entreprise"}), 400
    
    try:
        # Create robot with name, reference, and company ID
        robot = Robot(
            nom=data['nom'],
            referance=data['referance'],
            id_entreprise=current_user.id_entreprise
        )
        db.session.add(robot)
        db.session.commit()
        
        return jsonify({
            "status": "success", 
            "message": "Robot créé avec succès",
            "robot": robot.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400


@token_required
def get_all_robots(current_user):
    # Get robots for the current user's company
    if current_user.id_entreprise:
        robots = Robot.query.filter_by(id_entreprise=current_user.id_entreprise).all()
    else:
        # If no company assigned, return empty list
        robots = []
    return jsonify([r.to_dict() for r in robots]), 200


@token_required
def get_robot(current_user, robot_id):
    robot = Robot.query.get(robot_id)
    if not robot:
        return jsonify({"status": "error", "message": "Robot introuvable"}), 404
    
    # Check if user has access to this robot (same company)
    if current_user.id_entreprise and robot.id_entreprise != current_user.id_entreprise:
        return jsonify({"status": "error", "message": "Accès non autorisé à ce robot"}), 403
    
    return jsonify(robot.to_dict()), 200


@token_required
@role_required("directeur", "technicien_superieur")
def update_robot(current_user, robot_id):
    robot = Robot.query.get(robot_id)
    if not robot:
        return jsonify({"status": "error", "message": "Robot introuvable"}), 404

    # Check if user has access to this robot (same company)
    if current_user.id_entreprise and robot.id_entreprise != current_user.id_entreprise:
        return jsonify({"status": "error", "message": "Accès non autorisé à ce robot"}), 403

    data = request.get_json()
    try:
        robot.nom = data.get('nom', robot.nom)
        robot.referance = data.get('referance', robot.referance)
        db.session.commit()
        return jsonify(robot.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400


@token_required
@role_required("directeur")
def delete_robot(current_user, robot_id):
    robot = Robot.query.get(robot_id)
    if not robot:
        return jsonify({"status": "error", "message": "Robot introuvable"}), 404

    # Check if user has access to this robot (same company)
    if current_user.id_entreprise and robot.id_entreprise != current_user.id_entreprise:
        return jsonify({"status": "error", "message": "Accès non autorisé à ce robot"}), 403

    try:
        db.session.delete(robot)
        db.session.commit()
        return jsonify({"status": "success", "message": "Robot supprimé"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400
