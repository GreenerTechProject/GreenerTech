from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from database.config import db
from datetime import datetime

class Etat_bilan(db.Model):
    __tablename__ = 'etat_bilans'

    id = Column(Integer, primary_key=True)
    id_bilan = Column(Integer, ForeignKey('bilans.id'), nullable=False)
    nombre_tomates_maladies = Column(Integer, default=0)
    nombre_tomates_non_maladies = Column(Integer, default=0)
    nombre_malade1 = Column(Integer, default=0)
    nombre_malade2 = Column(Integer, default=0)
    temperature = Column(Float)
    humidite = Column(Float)
    luminosite = Column(Float)
    co2 = Column(Float)
    rendement = Column(Float)
    date = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "id_bilan": self.id_bilan,
            "nombre_tomates_maladies": self.nombre_tomates_maladies,
            "nombre_tomates_non_maladies": self.nombre_tomates_non_maladies,
            "nombre_malade1": self.nombre_malade1,
            "nombre_malade2": self.nombre_malade2,
            "temperature": self.temperature,
            "humidite": self.humidite,
            "luminosite": self.luminosite,
            "co2": self.co2,
            "rendement": self.rendement,
            "date": self.date.isoformat() if self.date else None
        }
