from flask import request, jsonify
from app.utils.security import token_required
from app.models.type_tache import TypeTache
from database.config import db

@token_required
def create_type_tache (current_user):
    data = request.get_json()
    try:
        new_type_tache = TypeTache(
            nom=data['nom']
        )
        db.session.add(new_type_tache)
        db.session.commit()
        return jsonify({'message': 'Type de tâche créé avec succès'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
# @token_required
# def get_all_type_taches():
#     try:
#         type_taches = TypeTache.query.all()
#         return jsonify([{'id': tt.id, 'nom': tt.nom} for tt in type_taches]), 200
#     except Exception as e:
#         return jsonify({'error': str(e)}), 400
    
# @token_required
# def get_type_tache(id):
#     try:
#         type_tache = TypeTache.query.get_or_404(id)
#         return jsonify({'id': type_tache.id, 'nom': type_tache.nom}), 200
#     except Exception as e:
#         return jsonify({'error': str(e)}), 400
    
# @token_required
# def update_type_tache(id):
#     data = request.get_json()
#     try:
#         type_tache = TypeTache.query.get_or_404(id)
#         type_tache.nom = data['nom']
#         db.session.commit()
#         return jsonify({'message': 'Type de tâche mis à jour avec succès'}), 200
#     except Exception as e:
#         return jsonify({'error': str(e)}), 400
    
# @token_required
# def delete_type_tache(id):
#     try:
#         type_tache = TypeTache.query.get_or_404(id)
#         db.session.delete(type_tache)
#         db.session.commit()
#         return jsonify({'message': 'Type de tâche supprimé avec succès'}), 200
#     except Exception as e:
#         return jsonify({'error': str(e)}), 400
    



