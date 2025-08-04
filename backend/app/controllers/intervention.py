# controllers/intervention.py
from flask import request, jsonify
from app.models.intervention import Intervention
from app.utils.security import token_required , role_required
from database.config import db
from app.models.user import User

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
def get_intervention(current_user, id):
    try:
        intervention = Intervention.query.get_or_404(id)
        return jsonify(intervention.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    

