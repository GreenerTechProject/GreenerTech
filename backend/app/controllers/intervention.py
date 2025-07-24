# controllers/intervention.py
from flask import request, jsonify
from app.models.intervention import Intervention
from app.utils.security import token_required , role_required
from database.config import db

@token_required
@role_required("technicien","technicien_superieur") 
def create_intervention(current_user):
    data = request.get_json()
    try:
        new_interv = Intervention(
            description=data['description'],
            id_user = current_user.id , 
            id_serre=data['id_serre'],
            id_type_tache=data['id_type_tache'],
            total_charges=data.get('total_charges', 0.0),
            date_debut=data.get('date_debut'),
            date_fin=data.get('date_fin'),
        )
        db.session.add(new_interv)
        db.session.commit()
        return jsonify({'message': 'Intervention créée avec succès'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@token_required
@role_required("technicien","technicien_superieur")
# controllers/intervention.py
def validate_intervention(current_user,id):
    try:
        intervention = Intervention.query.get_or_404(id)
        intervention.valid = True
        db.session.commit()
        return jsonify({'message': 'Intervention validée'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400