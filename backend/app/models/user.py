# models/user.py
from database.config import db
from datetime import datetime
from sqlalchemy import ForeignKey

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True)  # autorise NULL au début
    name = db.Column(db.String(100), nullable=True)      # autorise NULL au début
    role = db.Column(db.String(50), nullable=False)      # 'technicien', 'directeur', etc.
    
    birthday = db.Column(db.Date, nullable=True)
    id_assigned = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # directeur

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    is_valide = db.Column(db.Boolean, default=False)      # Validé par directeur
    email_valide = db.Column(db.Boolean, default=False)   # Technicien a complété

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'id_assigned': self.id_assigned,
            'is_valide': self.is_valide,
            'email_valide': self.email_valide,
        }