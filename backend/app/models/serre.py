from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from database.config import db

class Serre(db.Model):
    __tablename__ = "serres"

    id = Column(Integer, primary_key=True)
    nom = Column(String, nullable=False)
    id_group_cor = Column(Integer, nullable=False)
    surface = Column(Float, nullable=True)  # corresponds to 'area'
    center_lat = Column(Float, nullable=True)
    center_lng = Column(Float, nullable=True)
    id_domaine = Column(Integer, ForeignKey("domaines.id"), nullable=False)

    group_coords = relationship(
        "GroupCor",
        primaryjoin="Serre.id_group_cor == foreign(GroupCor.id_group_cor)",
        lazy="joined",
        viewonly=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "id_domaine": self.id_domaine,
            "surface": self.surface,
            "center": {
                "lat": self.center_lat,
                "lng": self.center_lng,
            } if self.center_lat is not None and self.center_lng is not None else None,
            "position": [g.to_dict() for g in self.group_coords] if self.group_coords else []
        }
