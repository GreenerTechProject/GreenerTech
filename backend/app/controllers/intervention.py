# controllers/intervention.py
from flask import request, jsonify
from app.models.intervention import Intervention
from app.models.serre import Serre
from app.utils.security import token_required , role_required
from database.config import db
from app.models.user import User
from app.models.serre import Serre
from app.models.type_tache import TypeTache

# controllers/intervention.py
from app.utils.notifications import envoyer_notification


@token_required
def create_intervention(current_user):
    data = request.get_json()
    try:
        new_interv = Intervention(
            description=data['description'],
            id_user=current_user.id,
            id_serre=data['id_serre'],
            id_type_tache=data['id_type_tache'],
            total_charges=data.get('total_charges', 0.0),
            date_debut=data.get('date_debut'),
            date_fin=data.get('date_fin'),
        )
        db.session.add(new_interv)
        db.session.flush()

        if current_user.role=='technicien' :
            tech_sup = User.query.filter_by(role='technicien_superieur', id=current_user.id_assigned).first()
            if tech_sup:
                # envoyer_notification(
                #     description=f"Nouvelle intervention à valider : {new_interv.description}",
                #     id_user=tech_sup.id,
                #     id_intervention=new_interv.id
                # )
                envoyer_notification(
                    description="Une nouvelle intervention a été créée.",
                    id_user=tech_sup.id,
                    id_intervention=new_interv.id,
                    type_notification="intervention_creee"
                )

        if current_user.role=='technicien_superieur' :
            new_interv.valid = True
        
        # tech_sup = User.query.filter_by(role='technicien_superieur', id=current_user.id_assigned).first()

        # if tech_sup:
        #     envoyer_notification(
        #         description=f"Nouvelle intervention à valider : {new_interv.description}",
        #         id_user=tech_sup.id,
        #         id_intervention=new_interv.id
        #     )
        db.session.commit()
        #return jsonify({'message': 'Intervention créée et notification envoyée'}), 201
        return jsonify(new_interv.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@token_required
@role_required("directeur", "technicien_superieur")
def validate_intervention(current_user,id):
    try:
        intervention = Intervention.query.get_or_404(id)
        intervention.valid = True
        # # Notifier le technicien (créateur de l'intervention)
        # envoyer_notification(
        #     description=f"Votre intervention '{intervention.description}' a été validée.",
        #     id_user=intervention.id_user,
        #     id_intervention=intervention.id
        # )
        envoyer_notification(
            description="Votre intervention a été validée par un technicien supérieur.",
            id_user=intervention.id_user,
            id_intervention=intervention.id,
            type_notification="intervention_validee"
        )
        db.session.commit()
        return jsonify({'message': 'Intervention validée'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
@token_required
@role_required("directeur", "technicien_superieur")
def get_all_interention (current_user):
    try:
        # recuperer les interfentions de l'utilisateur courant
        if current_user.role == 'technicien':
            interventions = Intervention.query.filter_by(id_user=current_user.id).all()
            return jsonify([intervention.to_dict() for intervention in interventions]), 200
        
        elif current_user.role == 'technicien_superieur':
            interventions = Intervention.query.all()
            return jsonify([intervention.to_dict() for intervention in interventions]), 200


    except Exception as e:
        return jsonify({'error': str(e)}), 400

@token_required
def get_interventions_by_assigned_serres(current_user):
    try:
        # Get serres assigned to the current user
        from app.models.autorisation_serre import Autorisation_serre
        
        # Get user's assigned serres
        autorisations = Autorisation_serre.query.filter_by(id_user=current_user.id).all()
        assigned_serre_ids = [auth.id_serre for auth in autorisations]
        
        if not assigned_serre_ids:
            return jsonify([]), 200
        
        # Get interventions from assigned serres
        interventions = Intervention.query.filter(Intervention.id_serre.in_(assigned_serre_ids)).all()
         
        result = []
        for intervention in interventions:
            intervention_data = intervention.to_dict()
            
            # Get serre information
            serre = Serre.query.get(intervention.id_serre)
            if serre:
                intervention_data['serre_nom'] = serre.nom
                if hasattr(serre, 'domaine') and serre.domaine:
                    intervention_data['domaine_nom'] = serre.domaine.nom
                else:
                    intervention_data['domaine_nom'] = "Domaine inconnu"
            
            # Get type_tache information
            type_tache = Type_tache.query.get(intervention.id_type_tache)
            if type_tache:
                intervention_data['type_nom'] = type_tache.nom
            
            result.append(intervention_data)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@token_required
def get_intervention(current_user, id):
    try:
        intervention = Intervention.query.get_or_404(id)
        return jsonify(intervention.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    

@token_required
@role_required("directeur")
def get_interventions_by_entreprise(current_user, entreprise_id):
    try:
        # Get all serres for the enterprise by first resolving domaines
        from app.models.domaine import Domaine

        domaines = Domaine.query.filter_by(id_entreprise=entreprise_id).all()
        domaine_ids = [d.id for d in domaines]

        if not domaine_ids:
            return jsonify([]), 200

        serres = Serre.query.filter(Serre.id_domaine.in_(domaine_ids)).all()
        serre_ids = [serre.id for serre in serres]

        if not serre_ids:
            return jsonify([]), 200
        
        # Get all interventions for these serres
        interventions = Intervention.query.filter(Intervention.id_serre.in_(serre_ids)).all()
        
        intervention_list = []
        for intervention in interventions:
            intervention_data = {
                'id': intervention.id,
                'date_intervention': intervention.date_debut.strftime('%Y-%m-%d') if intervention.date_debut else None,
                'description': intervention.description,
                'statut': intervention.status.value if intervention.status else 'encours',
                'serre_id': intervention.id_serre,
                'technicien_id': intervention.id_user,
                'type_tache_id': intervention.id_type_tache,
                'total_charges': intervention.total_charges,
                'created_at': intervention.date_debut.strftime('%Y-%m-%d') if intervention.date_debut else None,
                'updated_at': intervention.date_fin.strftime('%Y-%m-%d') if intervention.date_fin else None
            }
            intervention_list.append(intervention_data)
        
        return jsonify(intervention_list), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

