from database.config import db
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey

class Alerte(db.Model):
    __tablename__ = 'alertes'

    id = Column(Integer, primary_key=True)
    id_bilan = Column(Integer, ForeignKey('bilans.id'), nullable=False)
    status_alert = Column(Integer, nullable=False)
    maladie = Column(String, nullable=False)
    lien_image = Column(String)
    x1 = Column(Float)
    y1 = Column(Float)
    date = Column(Date)
    status = Column(String)  # e.g., "résolue", "non résolue"

    def to_dict(self):
        return {
            "id": self.id,
            "id_bilan": self.id_bilan,
            "status_alert": self.status_alert,
            "maladie": self.maladie,
            "lien_image": self.lien_image,
            "x1": self.x1,
            "y1": self.y1,
            "date": self.date.isoformat() if self.date else None,
            "status": self.status
        }
