from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from database.config import db

class Domaine(db.Model):
    __tablename__ = "domaines"

    id = Column(Integer, primary_key=True)
    nom = Column(String, nullable=False)
    surface = Column(Float, nullable=True)  # corresponds to 'area'
    center_lat = Column(Float, nullable=True)
    center_lng = Column(Float, nullable=True)
    path = Column(JSONB, nullable=True)  # list of {lat, lng}

    id_entreprise = Column(Integer, ForeignKey("entreprises.id"), nullable=False)
    
    group_coords = relationship(
        "GroupCor",
        primaryjoin="Domaine.id == foreign(GroupCor.id_group_cor)",
        lazy="joined",
        viewonly=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.nom,
            "area": self.surface,
            "center": {
                "lat": self.center_lat,
                "lng": self.center_lng
            } if self.center_lat is not None and self.center_lng is not None else None,
            "path": self.path or [],
            "companyId": self.id_entreprise,
        }
