# # utils/notifications.py
# from app.models.notification import Notification
# from database.config import db
# def envoyer_notification(description, id_user, id_intervention=None):
#     notif = Notification(
#         description=description,
#         id_user=id_user,
#         id_intervention=id_intervention
#     )
#     db.session.add(notif)
#     db.session.commit()
