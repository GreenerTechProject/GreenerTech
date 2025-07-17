from database.config import db

class Domaine(db.Model):
    __tablename__ = 'domaines'

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    localisation = db.Column(db.String(255), nullable=False)
    id_group_cor = db.Column(db.Integer, nullable=False)
    id_entreprise = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'id_group_cor': self.id_group_cor,
            'id_entreprise': self.id_entreprise
        }
