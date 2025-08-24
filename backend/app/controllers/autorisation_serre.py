from flask import request, jsonify
from app.models.autorisation_serre import Autorisation_serre
from database.config import db
from app.utils.security import token_required, role_required

@token_required
@role_required("directeur", "technicien_superieur")
def create_autorisation_serre(current_user):
    
    data = request.get_json()
    
    # Authorization checks for technicians
    if current_user.role == "technicien_superieur":
        # Check if the current user has access to the serre
        current_user_serre_auth = Autorisation_serre.query.filter_by(
            id_user=current_user.id,
            id_serre=data['id_serre']
        ).first()
        
        if not current_user_serre_auth:
            print(f"DEBUG: User {current_user.id} does not have access to serre {data['id_serre']}")
            return jsonify({
                "status": "error", 
                "message": "Vous n'avez pas accès à cette serre"
            }), 403
        
        # Check if the user being assigned is supervised by the current user
        from app.models.user import User
        target_user = User.query.get(data['id_user'])
        if not target_user:
            return jsonify({
                "status": "error", 
                "message": "Utilisateur cible non trouvé"
            }), 404
        
        if target_user.id_assigned != current_user.id:
            print(f"DEBUG: User {target_user.id} is not supervised by {current_user.id}")
            return jsonify({
                "status": "error", 
                "message": "Vous ne pouvez assigner que les techniciens que vous supervisez"
            }), 403
        
        print(f"DEBUG: Authorization check passed for user {current_user.id}")
    
    # For directors, no additional checks needed (they can manage all)
    elif current_user.role == "directeur":
        print(f"DEBUG: Director {current_user.id} authorized to create any autorisation")
    
    try:
        autorisation_serre = Autorisation_serre(
            id_user=data['id_user'],
            id_serre=data['id_serre']
        )
        print(f"DEBUG: Created autorisation_serre object: {autorisation_serre.to_dict()}")
        
        db.session.add(autorisation_serre)
        db.session.commit()
        print(f"DEBUG: Autorisation_serre committed to database with ID: {autorisation_serre.id}")

        return jsonify(autorisation_serre.to_dict()), 201

    except Exception as e:
        print(f"DEBUG: Error in create_autorisation_serre: {str(e)}")
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400

@token_required
@role_required("directeur", "technicien_superieur")
def get_autorisation_serre(current_user):
    """
    GET /autorisation_serre
      - optional query params: id_user, id_serre
    Returns autorisations filtered by given query params.
    """
    print(f"DEBUG: get_autorisation_serre called by user {current_user.id} with role {current_user.role}")
    
    id_serre = request.args.get('id_serre', type=int)
    id_user = request.args.get('id_user', type=int)
    
    print(f"DEBUG: Query params - id_serre: {id_serre}, id_user: {id_user}")

    query = Autorisation_serre.query
    
    # Authorization filtering for technicians
    if current_user.role == "technicien_superieur":
        # Get serres the current user has access to
        user_serre_auths = Autorisation_serre.query.filter_by(id_user=current_user.id).all()
        user_serre_ids = [auth.id_serre for auth in user_serre_auths]
        
        if not user_serre_ids:
            print(f"DEBUG: User {current_user.id} has no serre access")
            return jsonify({
                "status": "success",
                "data": []
            }), 200
        
        # Filter query to only show autorisations for serres the user has access to
        query = query.filter(Autorisation_serre.id_serre.in_(user_serre_ids))
        print(f"DEBUG: Filtering to serres: {user_serre_ids}")
        
        # If filtering by specific serre, check if user has access
        if id_serre is not None and id_serre not in user_serre_ids:
            print(f"DEBUG: User {current_user.id} does not have access to serre {id_serre}")
            return jsonify({
                "status": "error",
                "message": "Vous n'avez pas accès à cette serre"
            }), 403
    
    # Apply the requested filters
    if id_serre is not None:
        query = query.filter_by(id_serre=id_serre)
        print(f"DEBUG: Filtering by serre_id: {id_serre}")
    if id_user is not None:
        query = query.filter_by(id_user=id_user)
        print(f"DEBUG: Filtering by user_id: {id_user}")

    autorisation_serres = query.all()
    print(f"DEBUG: Found {len(autorisation_serres)} autorisations")
    
    for auth in autorisation_serres:
        print(f"DEBUG: Autorisation - id: {auth.id}, user: {auth.id_user}, serre: {auth.id_serre}")

    result = {
        "status": "success",
        "data": [a.to_dict() for a in autorisation_serres]
    }
    print(f"DEBUG: Returning result: {result}")

    return jsonify(result), 200



@token_required
@role_required("directeur", "technicien_superieur")
def delete_autorisation_serre(current_user, autorisation_id):
    print(f"DEBUG: delete_autorisation_serre called by user {current_user.id} with role {current_user.role}")
    
    autorisation_serre = Autorisation_serre.query.get(autorisation_id)
    if not autorisation_serre:
        return jsonify({"status": "error", "message": "Autorisation_serre non trouvée"}), 404

    print(f"DEBUG: Attempting to delete autorisation for user {autorisation_serre.id_user} and serre {autorisation_serre.id_serre}")

    # Authorization checks
    if current_user.role == "technicien_superieur":
        # Check if the current user has access to the serre
        current_user_serre_auth = Autorisation_serre.query.filter_by(
            id_user=current_user.id,
            id_serre=autorisation_serre.id_serre
        ).first()
        
        if not current_user_serre_auth:
            print(f"DEBUG: User {current_user.id} does not have access to serre {autorisation_serre.id_serre}")
            return jsonify({
                "status": "error", 
                "message": "Vous n'avez pas accès à cette serre"
            }), 403
        
        # Check if the user being unassigned is supervised by the current user
        from app.models.user import User
        target_user = User.query.get(autorisation_serre.id_user)
        if not target_user:
            return jsonify({
                "status": "error", 
                "message": "Utilisateur cible non trouvé"
            }), 404
        
        if target_user.id_assigned != current_user.id:
            print(f"DEBUG: User {target_user.id} is not supervised by {current_user.id}")
            return jsonify({
                "status": "error", 
                "message": "Vous ne pouvez supprimer que les autorisations des techniciens que vous supervisez"
            }), 403
        
        print(f"DEBUG: Authorization check passed for user {current_user.id}")
    
    # For directors, no additional checks needed (they can manage all)
    elif current_user.role == "directeur":
        print(f"DEBUG: Director {current_user.id} authorized to delete any autorisation")
    
    try:
        print(f"DEBUG: Deleting autorisation {autorisation_id}")
        db.session.delete(autorisation_serre)
        db.session.commit()
        print(f"DEBUG: Autorisation {autorisation_id} deleted successfully")
        
        return jsonify({
            "status": "success",
            "message": f"Autorisation_serre {autorisation_id} supprimée avec succès"
        }), 200

    except Exception as e:
        print(f"DEBUG: Error deleting autorisation: {str(e)}")
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400
