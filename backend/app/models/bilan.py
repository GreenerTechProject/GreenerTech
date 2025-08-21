from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database.config import db

class Bilan(db.Model):
    __tablename__ = "bilans"

    id = Column(Integer, primary_key=True)
    nom = Column(String, nullable=False)
    id_group_cor = Column(Integer, nullable=False)
    surface = Column(Float, nullable=True)  # corresponds to 'area'
    center_lat = Column(Float, nullable=True)
    center_lng = Column(Float, nullable=True)
    #id_entreprise = Column(Integer, ForeignKey("entreprises.id"), nullable=False)
    id_serre = Column(Integer, ForeignKey("serres.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Track who created the bilan

    group_coords = relationship(
        "GroupCor",
        primaryjoin="Bilan.id_group_cor == foreign(GroupCor.id_group_cor)",
        lazy="joined",
        viewonly=True
    )

    # Relationship to get creator information
    creator = relationship(
        "User",
        foreign_keys=[created_by],
        lazy="joined"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "surface": self.surface,
            "center": {
                "lat": self.center_lat,
                "lng": self.center_lng
            },
            #"id_group_cor": self.id_group_cor,
            #"id_entreprise": self.id_entreprise,
            "id_serre": self.id_serre,
            "created_by": self.created_by,
            "created_by_name": self.creator.name if self.creator else None,
            "position": [g.to_dict() for g in self.group_coords] if self.group_coords else []
        }
