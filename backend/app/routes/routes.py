from flask import Blueprint
from app.controllers.user import register, login

all_bp = Blueprint('all_bp', __name__)
all_bp.route('/register', methods=['POST'])(register)
all_bp.route('/login', methods=['POST'])(login)

all_bp.route('/user', methods=['PUT'])(update_user)
auth_bp.route('/user/<int:user_id>', methods=['PUT'])(update_user)
all_bp.route('/user', methods=['DELETE'])(delete_user)

__all__ = ['all_bp']