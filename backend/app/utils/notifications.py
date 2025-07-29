# utils/notifications.py
from app.models.notification import Notification
from database.config import db

def envoyer_notification(description, id_user ,id_intervention):
    notif = Notification(
        description=description,
        id_user=id_user,
        id_intervention=id_intervention

        # type_objet=type_objet ,
        # id_objet=id_objet ,
        # type_notification = type_notification
    )
    db.session.add(notif)
    db.session.commit()
