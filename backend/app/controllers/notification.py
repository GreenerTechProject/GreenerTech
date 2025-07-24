# # controllers/notification.py
# from flask import jsonify
# from app.models.notification import Notification

# def get_notifications_by_user(id_user):
#     notifs = Notification.query.filter_by(id_user=id_user).order_by(Notification.date.desc()).all()
#     return jsonify([{
#         'id': n.id,
#         'description': n.description,
#         'status': n.status,
#         'date': n.date.isoformat(),
#         'id_intervention': n.id_intervention
#     } for n in notifs])
