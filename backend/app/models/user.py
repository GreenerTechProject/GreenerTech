# models/user.py
from database.config import db
from datetime import datetime, timedelta, timezone
from sqlalchemy import ForeignKey


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=True)      # autorise NULL au début
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True)  # autorise NULL au début
    role = db.Column(db.String(50), nullable=False)      # 'technicien', 'directeur', etc.
    birthday = db.Column(db.Date, nullable=True)
    telephone = db.Column(db.String(20), nullable=True)
    cin = db.Column(db.String(50), nullable=True)
    id_assigned = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  
    setup_completed = db.Column(db.Boolean, nullable=False, default=False) #pour verifier la premier authentificatio
    created_at = db.Column(db.DateTime, default=datetime.now(timezone(timedelta(hours=1))))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone(timedelta(hours=1))), onupdate=datetime.now(timezone(timedelta(hours=1))))
    directeur_valide = db.Column(db.Boolean, default=False)      # Validé par directeur
    email_valide = db.Column(db.Boolean, default=False)   # Technicien a complété
    verification_token = db.Column(db.String(255), nullable=True)  # Token pour vérification email
    id_entreprise = db.Column(db.Integer, db.ForeignKey('entreprises.id'), nullable=True)  
    entreprise = db.relationship('Entreprise', backref='users', lazy=True)  # Relation avec Entreprise
    

    

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'birthday': self.birthday.isoformat() if self.birthday else None,
            'telephone': self.telephone,
            'cin': self.cin,
            'id_assigned': self.id_assigned,
            'setup_completed': self.setup_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'directeur_valide': self.directeur_valide,
            'email_valide': self.email_valide,
            'verification_token': self.verification_token
        }
