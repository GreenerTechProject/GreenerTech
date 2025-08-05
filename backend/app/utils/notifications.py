# utils/notifications.py
from app.models.notification import Notification
from database.config import db

# def envoyer_notification(description, id_user ,id_intervention):
#     notif = Notification(
#         description=description,
#         id_user=id_user,
#         id_intervention=id_intervention

#         # type_objet=type_objet ,
#         # id_objet=id_objet ,
#         # type_notification = type_notification
#     )
#     db.session.add(notif)
#     db.session.commit()
def envoyer_notification(description, id_user, type_notification, id_intervention=None):
    notif = Notification(
        description=description,
        id_user=id_user,
        id_intervention=id_intervention,
        type_notification=type_notification
    )

    db.session.add(notif)
    db.session.commit()
    # print la notification envoyée
    print(f"Notification envoyée : {description} pour l'utilisateur {id_user} avec le type {type_notification}")