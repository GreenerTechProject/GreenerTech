from sqlalchemy import Column, Integer, String ,ForeignKey
from database.config import db

class Entreprise(db.Model):
    __tablename__ = "entreprises"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    # id_user = Column(Integer, ForeignKey('users.id'), nullable=False)
    status_juridique = Column(String)
    adresse = Column(String)
    id_fiscale = Column(String)
    email = Column(String)


    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            # "id_user": self.id_user,
            "status_juridique": self.status_juridique,
            "adresse": self.adresse,
            "id_fiscale": self.id_fiscale,
            "email": self.email
        }