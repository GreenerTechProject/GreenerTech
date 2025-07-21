from flask import Blueprint

from app.controllers.user import register, login, get_user, update_user, delete_user
from app.controllers.entreprise import create_entreprise, get_entreprise, update_entreprise, delete_entreprise
from app.controllers.domaine import create_domaine, get_domaine, get_all_domaines, update_domaine, delete_domaine ,get_serres_by_domaine
from app.controllers.bilan import create_bilan, get_bilan, get_all_bilans, update_bilan, delete_bilan
from app.controllers.serre import create_serre, get_serre, get_all_serres, update_serre, delete_serre, get_bilans_by_serre


all_bp = Blueprint('all_bp', __name__)
all_bp.route('/register', methods=['POST'])(register)
all_bp.route('/login', methods=['POST'])(login)
all_bp.route('/user', methods=['GET'])(get_user)
all_bp.route('/user', methods=['PUT'])(update_user)
all_bp.route('/user', methods=['DELETE'])(delete_user)



all_bp.route('/entreprise', methods=['POST'])(create_entreprise)
all_bp.route('/entreprise', methods=['GET'])(get_entreprise)
all_bp.route('/entreprise', methods=['PUT'])(update_entreprise)
all_bp.route('/entreprise', methods=['DELETE'])(delete_entreprise)



all_bp.route('/domaine', methods=['POST'])(create_domaine)
all_bp.route('/domaine/<int:id>', methods=['GET'])(get_domaine)
all_bp.route('/domaine', methods=['GET'])(get_all_domaines)
all_bp.route('/domaine/<int:id_domaine>/serres', methods=['GET'])(get_serres_by_domaine)
all_bp.route('/domaine/<int:id>', methods=['PUT'])(update_domaine)
all_bp.route('/domaine/<int:id>', methods=['DELETE'])(delete_domaine)



all_bp.route('/serre', methods=['POST'])(create_serre)
all_bp.route('/serre/<int:id>', methods=['GET'])(get_serre)
all_bp.route('/serre', methods=['GET'])(get_all_serres)
all_bp.route('/serre/<int:id_serre>/bilans', methods=['GET'])(get_bilans_by_serre)
all_bp.route('/serre/<int:id>', methods=['PUT'])(update_serre)
all_bp.route('/serre/<int:id>', methods=['DELETE'])(delete_serre)



all_bp.route('/bilan', methods=['POST'])(create_bilan)
all_bp.route('/bilan/<int:id>', methods=['GET'])(get_bilan)
all_bp.route('/bilan', methods=['GET'])(get_all_bilans)
all_bp.route('/bilan/<int:id>', methods=['PUT'])(update_bilan)
all_bp.route('/bilan/<int:id>', methods=['DELETE'])(delete_bilan)


all_bp.route('/api/autorisations', methods=['POST'])(create_autorisation)
all_bp.route('/api/autorisations', methods=['GET'])(get_autorisations)
all_bp.route('/api/autorisations/<int:autorisation_id>', methods=['DELETE'])(delete_autorisation)



__all__ = ['all_bp']
