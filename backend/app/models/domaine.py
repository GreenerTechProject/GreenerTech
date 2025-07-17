from database.config import db

class Domaine(db.Model):
    __tablename__ = 'domaines'

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    localisation = db.Column(db.String(255), nullable=False)
    superficie = db.Column(db.Float, nullable=True)
    id_entreprise = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'localisation': self.localisation,
            'superficie': self.superficie,
            'id_entreprise': self.id_entreprise
        }
