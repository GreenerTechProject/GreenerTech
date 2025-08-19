from sqlalchemy import Column, Integer, String, ForeignKey
from database.config import db

class Robot(db.Model):
    __tablename__ = 'robots'

    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)
    referance = Column(String(100))
    id_entreprise = Column(Integer, ForeignKey('entreprises.id'), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "referance": self.referance,
            "id_entreprise": self.id_entreprise
        }
