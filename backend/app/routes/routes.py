from flask import Blueprint


from app.controllers.user import register, login, get_user, update_user, delete_user, create_technicien, register_technicien, verify_email, validate_technicien, get_technicien_by_email, get_all_technicians, get_techniciens_by_company

from app.controllers.entreprise import create_entreprise, get_entreprise, get_all_entreprises, update_entreprise, delete_entreprise
from app.controllers.domaine import create_domaine, get_domaine, get_all_domaines, update_domaine, delete_domaine, get_serres_by_domaine
from app.controllers.bilan import create_bilan, get_bilan, get_all_bilans, update_bilan, delete_bilan, generate_bilan_qrcode
from app.controllers.serre import create_serre, get_serre, get_all_serres, update_serre, delete_serre, get_bilans_by_serre, get_guides_by_serre, get_serres_by_user

from app.controllers.guide_culture import create_guide_culture , update_guide_culture, delete_guide, get_guide_culture, get_all_guides

from app.controllers.intervention import create_intervention, validate_intervention, get_all_interention, get_intervention, get_interventions_by_assigned_serres
from app.controllers.type_tache import create_type_tache , get_type_tache, get_all_type_taches

from app.controllers.notification import get_notifications_by_user, get_all_notifications, mark_notification_as_seen
from app.controllers.autorisation_domaine import create_autorisation_domaine, get_autorisation_domaine, delete_autorisation_domaine
from app.controllers.autorisation_serre import create_autorisation_serre, get_autorisation_serre, delete_autorisation_serre
from app.controllers.autorisation_bilan import create_autorisation_bilan, get_autorisation_bilan, delete_autorisation_bilan

from app.controllers.mission_robot import create_mission_robot, get_mission_robot, update_mission_robot, get_all_missions_robot, delete_mission_robot
from app.controllers.robot import create_robot, get_robot, update_robot, get_all_robots, delete_robot
from app.controllers.etat_bilan import create_etat_bilan, get_etat_bilan, update_etat_bilan, get_etat_bilan_by_bilan, get_last_etat_bilan_by_serre, delete_etat_bilan
from app.controllers.alerte import create_alerte, get_alerte, get_all_alertes, update_alerte, delete_alerte, get_alertes_by_assigned_serres
from app.controllers.rapport import create_rapport, get_all_rapports, get_rapport, update_rapport, delete_rapport

all_bp = Blueprint('all_bp', __name__)
all_bp.route('/register', methods=['POST'])(register)
all_bp.route('/login', methods=['POST'])(login)
all_bp.route('/user', methods=['GET'])(get_user)
all_bp.route('/user', methods=['PUT'])(update_user)
all_bp.route('/user', methods=['DELETE'])(delete_user)
# all_bp.route('/technicien/check_email', methods=['POST'])(check_email)
all_bp.route('/verify_email', methods=['GET'])(verify_email)



all_bp.route('/technicien', methods=['POST'])(create_technicien)
all_bp.route('/technicien/register', methods=['POST'])(register_technicien)
all_bp.route('/technicien', methods=['GET'])(get_technicien_by_email)
all_bp.route('/technicien/validate/<int:id>', methods=['PUT'])(validate_technicien)
all_bp.route('/technicien', methods=['GET'])(get_all_technicians)
all_bp.route('/technicien/company/<int:company_id>', methods=['GET'])(get_techniciens_by_company)


all_bp.route('/entreprise', methods=['POST'])(create_entreprise)
all_bp.route('/entreprise', methods=['GET'])(get_entreprise)
all_bp.route('/entreprises', methods=['GET'])(get_all_entreprises)
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
all_bp.route('/serre/<int:id_serre>/guides', methods=['GET'])(get_guides_by_serre)
all_bp.route('/serre/user', methods=['GET'])(get_serres_by_user)
all_bp.route('/serre/<int:id>', methods=['PUT'])(update_serre)
all_bp.route('/serre/<int:id>', methods=['DELETE'])(delete_serre)



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
all_bp.route('/guide_culture', methods=['GET'])(get_all_guides)

all_bp.route('/types-tache' , methods=['POST'])(create_type_tache)  
all_bp.route('/types-tache/<int:id>', methods=['GET'])(get_type_tache)
all_bp.route('/types-tache', methods=['GET'])(get_all_type_taches)

all_bp.route('/intervention', methods=['POST'])(create_intervention)

all_bp.route('/intervention/<int:id>', methods=['PUT'])(validate_intervention)
all_bp.route('/intervention', methods=['GET'])(get_all_interention)
all_bp.route('/intervention/assigned', methods=['GET'])(get_interventions_by_assigned_serres)
all_bp.route('/intervention/<int:id>', methods=['GET'])(get_intervention)


all_bp.route('/autorisation_domaine', methods=['POST'])(create_autorisation_domaine)
all_bp.route('/autorisation_domaine', methods=['GET'])(get_autorisation_domaine)
all_bp.route('/autorisation_domaine/<int:autorisation_id>', methods=['DELETE'])(delete_autorisation_domaine)



all_bp.route('/autorisation_serre', methods=['POST'])(create_autorisation_serre)
all_bp.route('/autorisation_serre', methods=['GET'])(get_autorisation_serre)
all_bp.route('/autorisation_serre/<int:autorisation_id>', methods=['DELETE'])(delete_autorisation_serre)



all_bp.route('/autorisation_bilan', methods=['POST'])(create_autorisation_bilan)
all_bp.route('/autorisation_bilan', methods=['GET'])(get_autorisation_bilan)
all_bp.route('/autorisation_bilan/<int:autorisation_id>', methods=['DELETE'])(delete_autorisation_bilan)



all_bp.route('/mission_robot', methods=['POST'])(create_mission_robot)
all_bp.route('/mission_robot', methods=['GET'])(get_all_missions_robot)
all_bp.route('/mission_robot/<int:mission_id>', methods=['PUT'])(update_mission_robot)
all_bp.route('/mission_robot/<int:mission_id>', methods=['GET'])(get_mission_robot)
all_bp.route('/mission_robot/<int:mission_id>', methods=['DELETE'])(delete_mission_robot)



all_bp.route('/robot', methods=['POST'])(create_robot)
all_bp.route('/robot', methods=['GET'])(get_all_robots)
all_bp.route('/robot/<int:robot_id>', methods=['PUT'])(update_robot)
all_bp.route('/robot/<int:robot_id>', methods=['GET'])(get_robot)
all_bp.route('/robot/<int:robot_id>', methods=['DELETE'])(delete_robot)



all_bp.route('/etat_bilan', methods=['POST'])(create_etat_bilan)
all_bp.route('/etat_bilan/<int:etat_bilan_id>', methods=['GET'])(get_etat_bilan)
#all_bp.route('/etat_bilan/serre/<int:serre_id>', methods=['GET'])(get_last_etat_bilan_by_serre)
all_bp.route('/etat_bilan/bilan/<int:bilan_id>', methods=['GET'])(get_etat_bilan_by_bilan)
all_bp.route('/etat_bilan/<int:etat_bilan_id>', methods=['PUT'])(update_etat_bilan)
all_bp.route('/etat_bilan/<int:etat_bilan_id>', methods=['DELETE'])(delete_etat_bilan)



all_bp.route('/alerte', methods=['POST'])(create_alerte)
all_bp.route('/alerte', methods=['GET'])(get_all_alertes)
all_bp.route('/alerte/assigned', methods=['GET'])(get_alertes_by_assigned_serres)
all_bp.route('/alerte/<int:alerte_id>', methods=['GET'])(get_alerte)
all_bp.route('/alerte/<int:alerte_id>', methods=['PUT'])(update_alerte)
all_bp.route('/alerte/<int:alerte_id>', methods=['DELETE'])(delete_alerte)



all_bp.route('/notifications/<int:id_user>', methods=['GET'])(get_notifications_by_user)
all_bp.route('/notifications', methods=['GET'])(get_all_notifications)
all_bp.route('/notifications/vue/<int:id>', methods=['PUT'])(mark_notification_as_seen)



all_bp.route('/rapport', methods=['POST'])(create_rapport)
all_bp.route('/rapport', methods=['GET'])(get_all_rapports)
all_bp.route('/rapport/<int:id>', methods=['GET'])(get_rapport)
all_bp.route('/rapport/<int:id>', methods=['PUT'])(update_rapport)
all_bp.route('/rapport/<int:id>', methods=['DELETE'])(delete_rapport)



__all__ = ['all_bp']
