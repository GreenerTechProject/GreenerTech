from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database.config import db

class Domaine(db.Model):
    __tablename__ = "domaines"

    id = Column(Integer, primary_key=True)
    nom = Column(String, nullable=False)
    id_group_cor = Column(Integer, nullable=False) 
    center = Column(Integer, nullable=False) 
    id_entreprise = Column(Integer, ForeignKey("entreprises.id"), nullable=False)

    group_coords = relationship(
        "GroupCor",
        primaryjoin="Domaine.id_group_cor == foreign(GroupCor.id_group_cor)",
        lazy="joined",
        viewonly=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            #"id_group_cor": self.id_group_cor,
            "id_entreprise": self.id_entreprise,
            "path": [g.to_dict() for g in self.group_coords] if self.group_coords else []
        }
