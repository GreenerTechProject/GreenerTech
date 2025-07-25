# models/notification.py
from database.config import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

class Notification(db.Model):
    id = Column(Integer, primary_key=True)
    description = Column(String(255), nullable=False)
    status = Column(String(50), default='non_vue')  # valeurs possibles : non_vue, vue
    date = Column(DateTime, default=datetime.utcnow)
    id_user = Column(Integer, ForeignKey('users.id'), nullable=False)
    id_intervention = Column(Integer, ForeignKey('intervention.id'), nullable=True)
