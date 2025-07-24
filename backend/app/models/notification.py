# # models/notification.py
# from database.config import db
# from datetime import datetime

# class Notification(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     description = db.Column(db.String(255), nullable=False)
#     status = db.Column(db.String(50), default='non_vue')  # valeurs possibles : non_vue, vue
#     date = db.Column(db.DateTime, default=datetime.utcnow)
#     id_user = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
#     id_intervention = db.Column(db.Integer, db.ForeignKey('intervention.id'), nullable=True)  # facultatif
