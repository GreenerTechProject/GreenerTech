# models/intervention.py
from database.config import db
from datetime import date
from enum import Enum
from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Boolean, Enum as SQLAlchemyEnum

class StatutInterventionEnum(str, Enum):
    ENCOURS = "encours"
    TERMINE = "terminé"

class Intervention(db.Model):
    id = Column(Integer, primary_key=True)
    description = Column(String(255), nullable=False)
    status = Column(SQLAlchemyEnum(StatutInterventionEnum), default=StatutInterventionEnum.ENCOURS, nullable=False)
    date_debut = Column(Date, default=date.today)
    date_fin = Column(Date, nullable=True)
    total_charges = Column(Float, default=0.0)
    id_user = Column(Integer, ForeignKey('users.id'), nullable=False)
    id_serre = Column(Integer, ForeignKey('serres.id'), nullable=False)
    id_type_tache = Column(Integer, ForeignKey('type_tache.id'), nullable=False)
    valid = Column(Boolean, default=False)  


    def to_dict(self):
        return {
            "id": self.id,
            "description": self.description,
            "status": self.status,
            "date_debut": self.date_debut.isoformat() if self.date_debut else None,
            "date_fin": self.date_fin.isoformat() if self.date_fin else None,
            "total_charges": self.total_charges,
            "id_user": self.id_user,
            "id_serre": self.id_serre,
            "id_type_tache": self.id_type_tache,
            "valid": self.valid
            }
