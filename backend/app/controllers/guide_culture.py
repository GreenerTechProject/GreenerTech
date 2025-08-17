from flask import request, jsonify
from app.models.guide_culture import GuideCulture
from app.models.serre import Serre
# from app.models.autorisation import Autorisation
from database.config import db
from app.utils.security import token_required, role_required
from app.models.entreprise import Entreprise
from app.models.domaine import Domaine

@token_required
@role_required("directeur", "technicien_superieur", "technicien")
def create_guide_culture(current_user):
    data = request.get_json()

    required_fields = ["nom", "date_debut_saison", "date_fin_saison", "nombre_de_plants", "id_serre"]
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Champs obligatoires manquants"}), 400

    serre = Serre.query.get(data["id_serre"])
    if not serre:
        return jsonify({"message": "Serre introuvable"}), 404

    # # Vérifier autorisation pour ce technicien
    # if current_user.role == "technicien":
    #     autorisation = Autorisation.query.filter_by(id_user=current_user.id, id_serre=serre.id).first()
    #     if not autorisation or not autorisation.access_serre:
    #         return jsonify({"message": "Non autorisé à accéder à cette serre"}), 403

    guide = GuideCulture(
        nom=data["nom"],
        rendement=data.get("rendement"),
        variete=data.get("variete"),
        date_debut_saison=data["date_debut_saison"],
        date_fin_saison=data["date_fin_saison"],
        nombre_de_plants=data["nombre_de_plants"],
        id_serre=data["id_serre"]
    )

    db.session.add(guide)
    db.session.commit()
    return jsonify(guide.to_dict()), 201


@token_required
@role_required("directeur", "technicien_superieur", "technicien")
def update_guide_culture(current_user, id):
    guide = GuideCulture.query.get(id)
    if not guide:
        return jsonify({"message": "Guide de culture introuvable"}), 404

    # # Vérifie si le technicien est autorisé à modifier cette serre
    # if current_user.role == "technicien":
    #     autorisation = Autorisation.query.filter_by(id_user=current_user.id, id_serre=guide.id_serre).first()
    #     if not autorisation or not autorisation.access_serre:
    #         return jsonify({"message": "Accès non autorisé à cette serre"}), 403

    data = request.get_json()

    # Mise à jour conditionnelle des champs
    guide.nom = data.get("nom", guide.nom)
    guide.rendement = data.get("rendement", guide.rendement)
    guide.variete = data.get("variete", guide.variete)
    guide.date_debut_saison = data.get("date_debut_saison", guide.date_debut_saison)
    guide.date_fin_saison = data.get("date_fin_saison", guide.date_fin_saison)
    guide.nombre_de_plants = data.get("nombre_de_plants", guide.nombre_de_plants)

    db.session.commit()

    return jsonify(guide.to_dict()), 200

@token_required
@role_required("directeur", "technicien_superieur", "technicien")
def get_guide_culture(current_user, id):
    guide = GuideCulture.query.get(id)
    if not guide:
        return jsonify({"message": "Guide de culture introuvable"}), 404

    # # Vérifie si le technicien est autorisé à accéder à cette serre
    # if current_user.role == "technicien":
    #     autorisation = Autorisation.query.filter_by(id_user=current_user.id, id_serre=guide.id_serre).first()
    #     if not autorisation or not autorisation.access_serre:
    #         return jsonify({"message": "Accès non autorisé à cette serre"}), 403

    return jsonify(guide.to_dict()), 200

@token_required
@role_required("directeur", "technicien_superieur", "technicien")
def get_all_guides(current_user):
    guides = GuideCulture.query.all()
    if not guides:
        return jsonify({"message": "Aucun guide de culture trouvé"}), 404

    result = [guide.to_dict() for guide in guides]
    return jsonify(result), 200



@token_required
@role_required("directeur", "technicien_superieur", "technicien")
def delete_guide(current_user, id):
    guide = GuideCulture.query.get(id)
    if not guide:
        return jsonify({"message": "Guide non trouvé"}), 404

    serre = Serre.query.get(guide.id_serre)
    if not serre:
        return jsonify({"message": "Serre associée introuvable"}), 404

    domaine = Domaine.query.get(serre.id_domaine)
    if not domaine:
        return jsonify({"message": "Domaine associé introuvable"}), 404

    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise or domaine.id_entreprise != entreprise.id:
        return jsonify({"message": "Accès non autorisé"}), 403

    db.session.delete(guide)
    db.session.commit()
    return jsonify({"message": "Guide supprimé avec succès"}), 200
