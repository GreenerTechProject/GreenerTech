from sqlalchemy import Column, Integer, String ,ForeignKey
from database.config import db
from sqlalchemy.orm import relationship


class Entreprise(db.Model):
    __tablename__ = "entreprises"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    id_user = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status_juridique = Column(String)
    adresse = Column(String)
    cie = Column(String)
    id_fiscale = Column(String)
    email = Column(String)
    

    
    createur = relationship(
        "User",
        back_populates="entreprises_creees",
        foreign_keys=[id_user]
    )
    
    membres = relationship(
        "User",
        back_populates="entreprise",
        foreign_keys="[User.id_entreprise]",
        cascade="all, delete-orphan"
    )

    domaines = relationship(
        "Domaine",
        backref="entreprise",
        cascade="all, delete-orphan"
    )

    robots = relationship(
        "Robot",
        backref="entreprise",
        cascade="all, delete-orphan"
    )


    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "id_user": self.id_user,
            "status_juridique": self.status_juridique,
            "adresse": self.adresse,
            "cie": self.cie,
            "id_fiscale": self.id_fiscale,
            "email": self.email
        }