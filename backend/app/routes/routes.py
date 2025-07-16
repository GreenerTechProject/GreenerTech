from flask import Blueprint
from app.controller.user import register, login

auth_bp = Blueprint('auth', __name__)
auth_bp.route('/register', methods=['POST'])(register)
auth_bp.route('/login', methods=['POST'])(login)

auth_bp.route('/user', methods=['PUT'])(update_user)
auth_bp.route('/user', methods=['GET'])(read_user)
auth_bp.route('/user', methods=['DELETE'])(delete_user)

__all__ = ['all_bp']