from sqlalchemy import Column, Integer, ForeignKey
from database.config import db

class Autorisation_domaine(db.Model):
    __tablename__ = 'autorisations_domaine'

    id = Column(Integer, primary_key=True)
    id_user = Column(Integer, ForeignKey('users.id'), nullable=False)
    id_domaine = Column(Integer, ForeignKey('domaines.id'), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "id_user": self.id_user,
            "id_domaine": self.id_domaine
        }
