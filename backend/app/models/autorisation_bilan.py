from sqlalchemy import Column, Integer, ForeignKey
from database.config import db

class Autorisation_bilan(db.Model):
    __tablename__ = 'autorisations_bilan'

    id = Column(Integer, primary_key=True)
    id_user = Column(Integer, ForeignKey('users.id'), nullable=False)
    id_bilan = Column(Integer, ForeignKey('bilans.id'), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "id_user": self.id_user,
            "id_bilan": self.id_bilan
        }
