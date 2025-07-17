from flask import Blueprint
from app.controllers.user import register, login, delete_user, update_user, get_user
from app.controllers.entreprise import create_entreprise, get_my_entreprise, update_entreprise, delete_entreprise

all_bp = Blueprint('all_bp', __name__)
all_bp.route('/register', methods=['POST'])(register)
all_bp.route('/login', methods=['POST'])(login)
all_bp.route('/user', methods=['DELETE'])(delete_user)
all_bp.route('/user', methods=['PUT'])(update_user)
all_bp.route('/user', methods=['GET'])(get_user)



all_bp.route('/entreprise', methods=['POST'])(create_entreprise)
all_bp.route('/entreprise', methods=['GET'])(get_my_entreprise)
all_bp.route('/entreprise', methods=['PUT'])(update_entreprise)
all_bp.route('/entreprise', methods=['DELETE'])(delete_entreprise)


__all__ = ['all_bp']
