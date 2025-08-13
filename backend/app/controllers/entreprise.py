from flask import request, jsonify
from app.models.entreprise import Entreprise
from app.models.domaine import Domaine
from app.models.serre import Serre
from app.models.bilan import Bilan
from database.config import db
from app.utils.security import token_required, role_required
from app.models.user import User

@token_required
@role_required("directeur")
def create_entreprise(current_user):
    data = request.get_json()
    entreprise = Entreprise(
        nom=data['nom'],
        id_user=current_user.id,
        status_juridique=data.get('status_juridique'),
        adresse=data.get('adresse'),
        cie=data.get('cie'),
        id_fiscale=data.get('id_fiscale'),
        email=data.get('email')
    )

    db.session.add(entreprise)
    # recuprer id de l'entreprise nouvellement créée
    db.session.flush()
    # Associer l'entreprise à l'utilisateur actuel
    current_user.id_entreprise = entreprise.id
    db.session.add(current_user)  # Mettre à jour l'utilisateur avec l'id_entreprise
    db.session.commit()
   #return jsonify({"message": "Entreprise créée avec succès", "entreprise": entreprise.to_dict()}), 201
    return jsonify(entreprise.to_dict()), 201

# === Récupérer l'entreprise du directeur connecté ===
@token_required
@role_required("directeur")
def get_entreprise(current_user):
    entreprises = Entreprise.query.filter_by(id_user=str(current_user.id)).all()
    
    if not entreprises:
        return jsonify({"message": "Aucune entreprise trouvée"}), 404

    result = []
    for e in entreprises:
        result.append({
            "id": e.id,
            "nom": e.nom,
            "status_juridique": e.status_juridique,
            "adresse": e.adresse,
            "cie": e.cie,
            "id_fiscale": e.id_fiscale,
            "email": e.email
        })

    return jsonify(result), 200
# === Modifier l'entreprise du directeur ===
@token_required
@role_required("directeur")
def update_entreprise(current_user):
    entreprise = Entreprise.query.filter_by(id_user=str(current_user.id)).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise trouvée"}), 404

    data = request.get_json()
    entreprise.nom = data.get('nom', entreprise.nom)
    entreprise.status_juridique = data.get('status_juridique', entreprise.status_juridique)
    entreprise.adresse = data.get('adresse', entreprise.adresse)
    entreprise.cie = data.get('cie', entreprise.cie)
    entreprise.id_fiscale = data.get('id_fiscale', entreprise.id_fiscale)
    entreprise.email = data.get('email', entreprise.email)

    db.session.commit()
    #return jsonify({"message": "Entreprise mise à jour"}), 200
    return jsonify(entreprise.to_dict()), 200

# === Supprimer l'entreprise du directeur ===
@token_required
@role_required("directeur")
def delete_entreprise(current_user):
    entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    if not entreprise:
        return jsonify({"message": "Aucune entreprise trouvée"}), 404

    db.session.delete(entreprise)
    db.session.commit()
    return jsonify({"message": "Entreprise supprimée"}), 200


# === Récupérer toutes les entreprises ===
def get_all_entreprises():
    try:
        entreprises = Entreprise.query.all()
        entreprise_list = [e.to_dict() for e in entreprises]

        return jsonify(entreprise_list), 200
    except Exception as e:
        print("Erreur dans list_entreprises:", str(e))
        return jsonify({"error": "Erreur lors de la récupération des entreprises"}), 500

# === Récupérer toutes les données de la carte pour une entreprise ===
@token_required
@role_required("directeur")
def get_company_map_data(current_user, company_id):
    try:
        # Verify the user has access to this company
        if str(current_user.id_entreprise) != str(company_id):
            return jsonify({"message": "Accès non autorisé à cette entreprise"}), 403
        
        # Fetch all domains for the company
        domains = Domaine.query.filter_by(id_entreprise=company_id).all()
        
        domains_data = []
        for domain in domains:
            domain_dict = {
                "id": str(domain.id),
                "name": domain.nom,
                "area": domain.surface or 0,
                "center": {
                    "lat": domain.center_lat or 0,
                    "lng": domain.center_lng or 0
                },
                "path": [],
                "companyId": str(domain.id_entreprise),
                "serres": []
            }
            
            # Fetch path points for the domain
            if hasattr(domain, 'group_coords') and domain.group_coords:
                domain_dict["path"] = [
                    {
                        "lat": point.point_x,
                        "lng": point.point_y,
                        "ordre": point.ordre
                    }
                    for point in sorted(domain.group_coords, key=lambda x: x.ordre)
                ]
            
            # Fetch serres for this domain
            serres = Serre.query.filter_by(id_domaine=domain.id).all()
            for serre in serres:
                serre_dict = {
                    "id": str(serre.id),
                    "nom": serre.nom,
                    "surface": serre.surface or 0,
                    "domainId": str(domain.id),
                    "position": [],
                    "center": {
                        "lat": serre.center_lat or domain.center_lat or 0,
                        "lng": serre.center_lng or domain.center_lng or 0
                    },
                    "bilans": []
                }
                
                # Fetch position points for the serre
                if hasattr(serre, 'group_coords') and serre.group_coords:
                    serre_dict["position"] = [
                        {
                            "lat": point.point_x,
                            "lng": point.point_y,
                            "ordre": point.ordre
                        }
                        for point in sorted(serre.group_coords, key=lambda x: x.ordre)
                    ]
                
                # Fetch bilans for this serre
                bilans = Bilan.query.filter_by(id_serre=serre.id).all()
                for bilan in bilans:
                    bilan_dict = {
                        "id": bilan.id,
                        "nom": bilan.nom,
                        "id_serre": bilan.id_serre,
                        "surface": bilan.surface,
                        "center_lat": bilan.center_lat,
                        "center_lng": bilan.center_lng,
                        "position": []
                    }
                    
                    # Fetch position points for the bilan
                    if hasattr(bilan, 'group_coords') and bilan.group_coords:
                        bilan_dict["position"] = [
                            {
                                "lat": point.point_x,
                                "lng": point.point_y,
                                "ordre": point.ordre
                            }
                            for point in sorted(bilan.group_coords, key=lambda x: x.ordre)
                        ]
                    
                    serre_dict["bilans"].append(bilan_dict)
                
                domain_dict["serres"].append(serre_dict)
            
            domains_data.append(domain_dict)
        
        return jsonify({
            "domains": domains_data
        }), 200
        
    except Exception as e:
        print("Erreur dans get_company_map_data:", str(e))
        return jsonify({"error": "Erreur lors de la récupération des données de la carte"}), 500