from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from database.config import db
from datetime import datetime, timedelta, timezone

class Etat_bilan(db.Model):
    __tablename__ = 'etat_bilans'

    id = Column(Integer, primary_key=True)
    id_bilan = Column(Integer, ForeignKey('bilans.id'), nullable=False)
    nombre_tomates_maladies = Column(Integer, default=0)
    nombre_tomates_non_maladies = Column(Integer, default=0)
    nombre_malade1 = Column(Integer, default=0)
    nombre_malade2 = Column(Integer, default=0)
    
    mean_temperature = Column(Float)
    mean_humidite = Column(Float)
    mean_luminosite = Column(Float)
    mean_co2 = Column(Float)
    
    max_temperature = Column(Float)
    max_humidite = Column(Float)
    max_luminosite = Column(Float)
    max_co2 = Column(Float)
    
    min_temperature = Column(Float)
    min_humidite = Column(Float)
    min_luminosite = Column(Float)
    min_co2 = Column(Float)
    
    #rendement = Column(Float)
    date = Column(DateTime, default=datetime.now(timezone(timedelta(hours=1))))

    def to_dict(self):
        return {
            "id": self.id,
            "id_bilan": self.id_bilan,
            "nombre_tomates_maladies": self.nombre_tomates_maladies,
            "nombre_tomates_non_maladies": self.nombre_tomates_non_maladies,
            "nombre_malade1": self.nombre_malade1,
            "nombre_malade2": self.nombre_malade2,

            "mean_temperature": self.mean_temperature,
            "mean_humidite": self.mean_humidite,
            "mean_luminosite": self.mean_luminosite,
            "mean_co2": self.mean_co2,

            "max_temperature": self.max_temperature,
            "max_humidite": self.max_humidite,
            "max_luminosite": self.max_luminosite,
            "max_co2": self.max_co2,

            "min_temperature": self.min_temperature,
            "min_humidite": self.min_humidite,
            "min_luminosite": self.min_luminosite,
            "min_co2": self.min_co2,

            #"rendement": self.rendement,
            "date": self.date.isoformat() if self.date else None
        }
