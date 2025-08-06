from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database.config import db

from sqlalchemy import Float, Date


class GuideCulture(db.Model):
    __tablename__ = "guide_cultures"

    id = Column(Integer, primary_key=True)
    nom = Column(String, nullable=False)
    rendement = Column(Float)
    variete = Column(String)
    date_debut_saison = Column(Date, nullable=False)
    date_fin_saison = Column(Date, nullable=False)
    nombre_de_plants = Column(Integer, nullable=False)
    id_serre = Column(Integer, ForeignKey("serres.id"), nullable=False)
    
    #{"variety":"poivron","yield":21.5,"plantingDate":"2025-07-31T23:00:00.000Z","harvestDate":"2025-08-29T23:00:00.000Z","irrigationType":"micro-aspersion","notes":"dd"}

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "rendement": self.rendement,
            "variete": self.variete,
            "date_debut_saison": self.date_debut_saison.isoformat(),
            "date_fin_saison": self.date_fin_saison.isoformat(),
            "nombre_de_plants": self.nombre_de_plants,
            "id_serre": self.id_serre
        }
