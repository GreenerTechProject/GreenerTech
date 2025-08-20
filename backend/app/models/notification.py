# models/notification.py
from database.config import db
from datetime import datetime, timedelta, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

class Notification(db.Model):
    __tablename__ = 'notification'

    id = Column(Integer, primary_key=True)
    description = Column(String(255), nullable=False)
    status = Column(String(50), default='non_vue')  # non_vue, vue
    date = Column(DateTime, default=datetime.now(timezone(timedelta(hours=1))))
    
    id_user = Column(Integer, ForeignKey('users.id'), nullable=False)
    id_intervention = Column(Integer, ForeignKey('intervention.id'), nullable=True)
    
    type_notification = Column(String(50), nullable=False)  # Exemple: compte_technicien, intervention_creee, intervention_validee, compte_valide
