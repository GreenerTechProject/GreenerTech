from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from database.config import db
from datetime import datetime, timedelta, timezone

class MissionRobot(db.Model):
    __tablename__ = 'missions_robot'

    id = Column(Integer, primary_key=True)
    id_robot = Column(Integer, ForeignKey('robots.id'), nullable=False)
    id_serre = Column(Integer, ForeignKey('serres.id'), nullable=False)
    rep_jr = Column(Integer)# 0, 1 for repetition every day, 0 for no repetition 
    rep_sem = Column(Integer)# 0 for no repetition, 1 for repetition every week, 2 for every two weeks, etc.
    jour = Column(Integer)  # 'lundi'=1 , 'mardi'=2, etc.
    heure = Column(Integer)  
    minute = Column(Integer) 
    date_debut = Column(DateTime, nullable=True) #, default=datetime.now(timezone(timedelta(hours=1))) 
    date_fin = Column(DateTime, nullable=True)
    executed = db.Column(db.Boolean, default=False)
    bilans = Column(JSON, default=[])  # <-- Nouveau champ JSON pour les IDs des bilans


    def to_dict(self):
        return {
            'id': self.id,
            'id_robot': self.id_robot,
            'id_serre': self.id_serre,
            'rep_jr': self.rep_jr,
            'rep_sem': self.rep_sem,
            'jour': self.jour,
            'heure': self.heure,
            'minute': self.minute,
            'date_debut': self.date_debut.isoformat() if self.date_debut else None,
            'date_fin': self.date_fin.isoformat() if self.date_fin else None,
            'executed': self.executed,
            'bilans' : self.bilans if self.bilans else []
        }




