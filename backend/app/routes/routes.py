from flask import Blueprint
from app.controllers.user import register, login, delete_user, update_user, get_user
from app.controllers.entreprise import create_entreprise, get_my_entreprise, update_entreprise, delete_entreprise
from app.controllers.serre import  get_serres , ajouter_serre, modifier_serre, supprimer_serre


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

# Add other routes here as needed
all_bp.route('/serres', methods=['POST'])(ajouter_serre )         # Créer une serre
all_bp.route('/serres', methods=['GET'])(get_serres)             # Récupérer toutes les serres
all_bp.route('/serres/<int:serre_id>', methods=['PUT'])(modifier_serre)  # Modifier une serre
all_bp.route('/serres/<int:serre_id>', methods=['DELETE'])(supprimer_serre)  # Supprimer une serre
# all_bp.route('/serres/<int:serre_id>', methods=['GET'])(get)






__all__ = ['all_bp']
