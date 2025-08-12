from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from database.config import db

class Autorisation_serre(db.Model):
    __tablename__ = 'autorisations_serre'

    id = Column(Integer, primary_key=True)
    id_user = Column(Integer, ForeignKey('users.id'), nullable=False)
    id_serre = Column(Integer, ForeignKey('serres.id'), nullable=False)

    # without this line I get duplicated rows , duplicated authorizations
    # this to avoid duplicate authorizations
    __table_args__ = (
        UniqueConstraint('id_user', 'id_serre', name='unique_user_serre'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "id_user": self.id_user,
            "id_serre": self.id_serre
        }
