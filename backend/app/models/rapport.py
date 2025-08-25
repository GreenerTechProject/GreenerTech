from sqlalchemy import Column, Integer, String,Date ,ForeignKey
from database.config import db

class Rapport(db.Model):
    __tablename__ = 'rapport'
    
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    description = Column(String(255), nullable=False)
    lien_pdf = Column(String(255), nullable=True)

    id_serre = Column(Integer, ForeignKey('serres.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    



    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'description': self.description,
            'lien_pdf': self.lien_pdf,
            'id_serre': self.id_serre,
            'user_id': self.user_id
        }
