from flask import Blueprint

from app.controllers.user import register, login, get_user, update_user, delete_user,create_technicien
from app.controllers.entreprise import create_entreprise, get_entreprise, update_entreprise, delete_entreprise
from app.controllers.domaine import create_domaine, get_domaine, get_all_domaines, update_domaine, delete_domaine ,get_serres_by_domaine
from app.controllers.bilan import create_bilan, get_bilan, get_all_bilans, update_bilan, delete_bilan,generate_bilan_qrcode
from app.controllers.serre import create_serre, get_serre, get_all_serres, update_serre, delete_serre
from app.controllers.guide_culture import create_guide_culture , update_guide_culture, delete_guide, get_guide_culture
from app.controllers.intervention import create_intervention
from app.controllers.type_tache import create_type_tache

from app.controllers.notification import get_notifications_by_user,get_all_notifications , mark_notification_as_seen


all_bp = Blueprint('all_bp', __name__)
all_bp.route('/register', methods=['POST'])(register)
all_bp.route('/login', methods=['POST'])(login)
all_bp.route('/user', methods=['GET'])(get_user)
all_bp.route('/user', methods=['PUT'])(update_user)
all_bp.route('/user', methods=['DELETE'])(delete_user)

all_bp.route('/technicien', methods=['POST'])(create_technicien)



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
all_bp.route('/serre/<int:id>', methods=['PUT'])(update_serre)
all_bp.route('/serre/<int:id>', methods=['DELETE'])(delete_serre)
# all_bp.route("/serres/<int:id_serre>/guides", methods=["GET"])(get_guides_by_serre)



all_bp.route('/bilan', methods=['POST'])(create_bilan)
all_bp.route('/bilan/<int:id>', methods=['GET'])(get_bilan)
all_bp.route('/bilan', methods=['GET'])(get_all_bilans)
all_bp.route('/bilan/<int:id>', methods=['PUT'])(update_bilan)
all_bp.route('/bilan/<int:id>', methods=['DELETE'])(delete_bilan)
all_bp.route('/bilan/<int:bilan_id>/qrcode', methods=['GET'])(generate_bilan_qrcode)


all_bp.route('/guide_culture', methods=['POST'])(create_guide_culture)
all_bp.route('/guide_culture/<int:id>', methods=['PUT'])(update_guide_culture)
all_bp.route('/guide_culture/<int:id>', methods=['DELETE'])(delete_guide)
all_bp.route('/guide_culture/<int:id>', methods=['GET'])(get_guide_culture)
# all_bp.route('/guide_culture', methods=['GET'])(get_all_guides)

all_bp.route('/typetache' , methods=['POST'])(create_type_tache)  

all_bp.route('/intervention', methods=['POST'])(create_intervention)

all_bp.route('/notifications/<int:id_user>', methods=['GET'])(get_notifications_by_user)
all_bp.route('/notifications', methods=['GET'])(get_all_notifications)
all_bp.route('/notifications/vue/<int:id>', methods=['PATCH'])(mark_notification_as_seen)

__all__ = ['all_bp']
