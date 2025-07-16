from flask import Blueprint
from app.controllers.user import register, login

auth_bp = Blueprint('auth', __name__)
auth_bp.route('/register', methods=['POST'])(register)
auth_bp.route('/login', methods=['POST'])(login)

__all__ = ['all_bp']