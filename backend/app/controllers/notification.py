from flask import jsonify, request
from app.models.notification import Notification
from database.config import db


# ✅ Récupérer les notifications par utilisateur, avec option de filtrage par type
def get_notifications_by_user(id_user):
    type_notification = request.args.get('type')  # ?type=intervention_validee

    query = Notification.query.filter_by(id_user=id_user)
    if type_notification:
        query = query.filter_by(type_notification=type_notification)

    notifs = query.order_by(Notification.date.desc()).all()

    return jsonify([{
        'id': n.id,
        'description': n.description,
        'status': n.status,
        'date': n.date.isoformat(),
        'id_intervention': n.id_intervention,
        'type_notification': n.type_notification
    } for n in notifs]), 200


# ✅ Récupérer toutes les notifications (admin ou debug)
def get_all_notifications():
    notifs = Notification.query.order_by(Notification.date.desc()).all()
    return jsonify([{
        'id': n.id,
        'description': n.description,
        'status': n.status,
        'date': n.date.isoformat(),
        'id_user': n.id_user,
        'id_intervention': n.id_intervention,
        'type_notification': n.type_notification
    } for n in notifs]), 200


# ✅ Marquer une notification comme "vue"
def mark_notification_as_seen(id):
    try:
        notif = Notification.query.get_or_404(id)
        notif.status = 'vue'
        db.session.commit()
        return jsonify({'message': 'Notification marquée comme vue'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# ✅ Supprimer une notification (optionnel pour nettoyage)
def delete_notification(id):
    try:
        notif = Notification.query.get_or_404(id)
        db.session.delete(notif)
        db.session.commit()
        return jsonify({'message': 'Notification supprimée'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
