from flask import Blueprint
from app.controllers.user import register, login

all_bp = Blueprint('all_bp', __name__)
all_bp.route('/register', methods=['POST'])(register)
all_bp.route('/login', methods=['POST'])(login)

__all__ = ['all_bp']