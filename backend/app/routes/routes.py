from flask import Blueprint
from app.controllers.user import register, login , delete_user, update_user

all_bp = Blueprint('all_bp', __name__)
all_bp.route('/register', methods=['POST'])(register)
all_bp.route('/login', methods=['POST'])(login)
all_bp.route('/users/<int:user_id>', methods=['DELETE'])(delete_user)

all_bp.route('/user/<int:user_id>', methods=['PUT'])(update_user)
all_bp.route('/user', methods=['GET'])(get_user)
all_bp.route('/user', methods=['DELETE'])(delete_user)

__all__ = ['all_bp']