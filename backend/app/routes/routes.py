from flask import Blueprint

from app.controllers.user import register, login, get_user, update_user, delete_user
from app.controllers.entreprise import create_entreprise, get_entreprise, update_entreprise, delete_entreprise
from app.controllers.domaine import create_domaine, get_domaine, get_all_domaines, update_domaine, delete_domaine
from app.controllers.serre import  get_serres , ajouter_serre, modifier_serre, supprimer_serre

all_bp = Blueprint('all_bp', __name__)
all_bp.route('/register', methods=['POST'])(register)
all_bp.route('/login', methods=['POST'])(login)
all_bp.route('/user', methods=['DELETE'])(delete_user)
all_bp.route('/user', methods=['PUT'])(update_user)
all_bp.route('/user', methods=['GET'])(get_user)


all_bp.route('/entreprise', methods=['POST'])(create_entreprise)
all_bp.route('/entreprise', methods=['GET'])(get_entreprise)
all_bp.route('/entreprise', methods=['PUT'])(update_entreprise)
all_bp.route('/entreprise', methods=['DELETE'])(delete_entreprise)

all_bp.route('/serres', methods=['GET'])(get_serres)
all_bp.route('/serre', methods=['POST'])(ajouter_serre)
all_bp.route('/serre/<int:id>', methods=['PUT'])(modifier_serre)
all_bp.route('/serre/<int:id>', methods=['DELETE'])(supprimer_serre)


all_bp.route('/domaine', methods=['POST'])(create_domaine)
all_bp.route('/domaine/<int:id>', methods=['GET'])(get_domaine)
all_bp.route('/domaine', methods=['GET'])(get_all_domaines)
all_bp.route('/domaine/<int:id>', methods=['PUT'])(update_domaine)
all_bp.route('/domaine/<int:id>', methods=['DELETE'])(delete_domaine)


__all__ = ['all_bp']
