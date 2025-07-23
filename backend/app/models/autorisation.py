from sqlalchemy import Column, Integer, ForeignKey
from database.config import db

class Autorisation(db.Model):
    __tablename__ = 'autorisations'

    id = Column(Integer, primary_key=True)
    id_user = Column(Integer, ForeignKey('users.id'), nullable=False)
    id_serre = Column(Integer, ForeignKey('serres.id'), nullable=False)
    access_serre = Column(Integer, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "id_user": self.id_user,
            "id_serre": self.id_serre,
            "access_serre": self.access_serre
        }
