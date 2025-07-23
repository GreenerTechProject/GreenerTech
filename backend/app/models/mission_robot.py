from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from database.config import db
from datetime import datetime

class MissionRobot(db.Model):
    __tablename__ = 'missions_robot'

    id = Column(Integer, primary_key=True)
    id_robot = Column(Integer, ForeignKey('robots.id'), nullable=False)
    type_tache = Column(String(100), nullable=False)
    description = Column(Text)
    date_debut = Column(DateTime, default=datetime.utcnow)
    date_fin = Column(DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "id_robot": self.id_robot,
            "type_tache": self.type_tache,
            "description": self.description,
            "date_debut": self.date_debut.isoformat() if self.date_debut else None,
            "date_fin": self.date_fin.isoformat() if self.date_fin else None,
        }
