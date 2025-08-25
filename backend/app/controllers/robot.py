from flask import request, jsonify
from app.models.robot import Robot
from database.config import db
from app.utils.security import token_required, role_required

#@token_required
#@role_required("directeur", "technicien_superieur")
def create_robot():
    data = request.get_json()
    try:
        robot = Robot(
            nom=data['nom'],
            referance=data.get('referance')
        )
        db.session.add(robot)
        db.session.commit()
        return jsonify(robot.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400


@token_required
def get_all_robots(current_user):
    robots = Robot.query.all()
    return jsonify([r.to_dict() for r in robots]), 200


@token_required
def get_robot(current_user, robot_id):
    robot = Robot.query.get(robot_id)
    if not robot:
        return jsonify({"status": "error", "message": "Robot introuvable"}), 404
    return jsonify(robot.to_dict()), 200


@token_required
@role_required("directeur", "technicien_superieur")
def update_robot(current_user, robot_id):
    robot = Robot.query.get(robot_id)
    if not robot:
        return jsonify({"status": "error", "message": "Robot introuvable"}), 404

    data = request.get_json()
    try:
        robot.nom = data.get('nom', robot.nom)
        robot.referance = data.get('referance', robot.referance)
        robot.id_entreprise = data.get('id_entreprise', robot.id_entreprise)
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
    try:
        db.session.delete(robot)
        db.session.commit()
        return jsonify({"status": "success", "message": "Robot supprimé"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400
