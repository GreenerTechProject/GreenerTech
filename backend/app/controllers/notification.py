# controllers/notification.py
from flask import jsonify
from app.models.notification import Notification

from database.config import db

def get_notifications_by_user(id_user):
    notifs = Notification.query.filter_by(id_user=id_user).order_by(Notification.date.desc()).all()
    return jsonify([{
        'id': n.id,
        'description': n.description,
        'status': n.status,
        'date': n.date.isoformat(),
        'id_intervention': n.id_intervention
    } for n in notifs])

#get all notifications
def get_all_notifications():
    notifs = Notification.query.order_by(Notification.date.desc()).all()
    return jsonify([{
        'id': n.id,
        'description': n.description,
        'status': n.status,
        'date': n.date.isoformat(),
        'id_user': n.id_user,
        'id_intervention': n.id_intervention
    } for n in notifs])


def mark_notification_as_seen(id):
    try:
        notif = Notification.query.get_or_404(id)
        notif.status = 'vue'
        db.session.commit()
        return jsonify({'message': 'Notification marquée comme vue'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400