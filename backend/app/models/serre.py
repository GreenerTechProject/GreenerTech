# app/models/serre.py

from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from database.config import db

class Serre(db.Model):
    __tablename__ = "serres"

    id = Column(Integer, primary_key=True)
    nom_serre = Column(String, nullable=False)
    id_group_cor = Column(Integer, ForeignKey("group_cor.id_group_cor"), nullable=False)
    date_creation = Column(Date, nullable=False)
    id_domaine = Column(Integer, ForeignKey("domaines.id"), nullable=False)

    domaine = relationship("Domaine", backref="serres")
    group_coords = relationship(
        "GroupCor",
        primaryjoin="Serre.id_group_cor == GroupCor.id_group_cor",
        lazy="joined",
        viewonly=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "nom_serre": self.nom_serre,
            "date_creation": self.date_creation.isoformat(),
            "id_domaine": self.id_domaine,
            "id_group_cor": self.id_group_cor,
            "group_coords": [g.to_dict() for g in self.group_coords] if self.group_coords else []
        }
