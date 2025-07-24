from flask import request, jsonify, send_file, abort
from app.models.bilan import Bilan
from app.models.points_gps import GroupCor
from database.config import db
from app.utils.security import token_required, role_required, access_serre_required, access_bilan_required
#from app.models.entreprise import Entreprise
from app.models.serre import Serre
from sqlalchemy import func

import qrcode
from io import BytesIO

@token_required
#@role_required("directeur")
@access_serre_required
def create_bilan(current_user):
    data = request.get_json()
    serre = Serre.query.get_or_404(data['id_serre'])

    # Récupérer entreprise liée au directeur connecté
    #entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    #if not entreprise:
    #    return jsonify({"message": "Aucune entreprise associée à cet utilisateur"}), 404


    # Récupérer le dernier id_group_cor existant (max)
    last_id_group_cor = db.session.query(func.max(GroupCor.id_group_cor)).scalar()
    if last_id_group_cor is None:
        last_id_group_cor = 0  # si pas encore d'enregistrement

    id_group_cor = last_id_group_cor + 1


    gps_points = data.get('position', [])
    if not gps_points:
        return jsonify({"message": "Veuillez fournir une liste de points GPS"}), 400

    # Créer chaque point group_cor
    for point in gps_points:
        gc = GroupCor(
            id_group_cor=id_group_cor,
            point_x=point['latitude'],
            point_y=point['longitude'],
            ordre=point.get('ordre', 0)
        )
        db.session.add(gc)

    # Créer le bilan
    bilan = Bilan(
        nom=data['nom'],
        id_group_cor=id_group_cor,
        id_serre=serre.id,
        #id_entreprise=entreprise.id
    )
    db.session.add(bilan)
    db.session.commit()

    #return jsonify({"message": "Bilan et points GPS créés", "bilan": bilan.to_dict()}), 201
    return jsonify(bilan.to_dict()), 201


@token_required
#@role_required("directeur")
def get_all_bilans(current_user, id):
    serre = Serre.query.get_or_404(id)
    #entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    #if not entreprise:
    #    return jsonify({"message": "Aucune entreprise associée"}), 404

    bilans = Serre.query.filter_by(id_serre=serre.id).all()
    return jsonify([d.to_dict() for d in bilans]), 200

@token_required
#@role_required("directeur")
@access_bilan_required
def get_bilan(current_user, id):
    bilan = Bilan.query.get_or_404(id)
    #entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    #if not entreprise or bilan.id_entreprise != entreprise.id:
    #    return jsonify({"message": "Non autorisé à accéder à ce bilan"}), 403

    return jsonify(bilan.to_dict()), 200

@token_required
#@role_required("directeur")
@access_bilan_required
def update_bilan(current_user, id):
    bilan = Bilan.query.get_or_404(id)
    #entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    #if not entreprise or bilan.id_entreprise != entreprise.id:
    #    return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()
    bilan.nom = data.get('nom', bilan.nom)

    gps_points = data.get('gps_points')
    if gps_points:
        # Supprimer les anciens points liés
        GroupCor.query.filter_by(id_group_cor=bilan.id_group_cor).delete()

        for point in gps_points:
            new_point = GroupCor(
                id_group_cor=bilan.id_group_cor,
                point_x=point['point_x'],
                point_y=point['point_y'],
                ordre=point.get('ordre', 0)
            )
            db.session.add(new_point)

    db.session.commit()
    #return jsonify({"message": "Bilan mis à jour", "bilan": bilan.to_dict()}), 200
    return jsonify(bilan.to_dict()), 200


@token_required
#@role_required("directeur")
@access_bilan_required
def delete_bilan(current_user, id):
    bilan = Bilan.query.get_or_404(id)
    #entreprise = Entreprise.query.filter_by(id_user=current_user.id).first()
    #if not entreprise or bilan.id_entreprise != entreprise.id:
    #    return jsonify({"message": "Non autorisé"}), 403

    GroupCor.query.filter_by(id_group_cor=bilan.id_group_cor).delete()
    db.session.delete(bilan)
    db.session.commit()
    
    return jsonify({"message": "Bilan supprimé"}), 200


def generate_bilan_qrcode(bilan_id):
    bilan = Bilan.query.get(bilan_id)
    if not bilan:
        return abort(404, description="Bilan non trouvé")

    # Contenu du QR code (tu peux changer ici selon ton besoin)
    qr_data = bilan.to_dict()  # ou bien f"https://greenertech.com/bilan/{bilan.id}"
    
    # Création du QR code
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Convertir l'image en flux binaire
    img_io = BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/png')
