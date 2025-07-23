from sqlalchemy import Column, Integer, String, ForeignKey
from database.config import db

class Robot(db.Model):
    __tablename__ = 'robots'

    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)
    modele = Column(String(100))
    type_robot = Column(String(100))
    id_domaine = Column(Integer, ForeignKey('domaines.id'), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "modele": self.modele,
            "type_robot": self.type_robot,
            "id_domaine": self.id_domaine
        }
