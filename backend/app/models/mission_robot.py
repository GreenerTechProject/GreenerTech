from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from database.config import db
from datetime import datetime, timedelta, timezone

class MissionRobot(db.Model):
    __tablename__ = 'missions_robot'

    id = Column(Integer, primary_key=True)
    id_robot = Column(Integer, ForeignKey('robots.id'), nullable=False)
    id_serre = Column(Integer, ForeignKey('serres.id'), nullable=False)
    rep_jr = Column(Integer)
    rep_sem = Column(Integer)
    date_debut = Column(DateTime, default=datetime.now(timezone(timedelta(hours=1))))
    date_fin = Column(DateTime)
    executed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "id_robot": self.id_robot,
            "id_serre": self.id_serre,
            "rep_jr": self.rep_jr,
            "rep_sem": self.rep_sem,
            "date_debut": self.date_debut.isoformat() if self.date_debut else None,
            "date_fin": self.date_fin.isoformat() if self.date_fin else None,
            "executed": self.executed
        }
