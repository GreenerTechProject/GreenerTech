from database.config import db

class TypeTache(db.Model):
    __tablename__ = 'type_tache'

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False, unique=True)

    interventions = db.relationship("Intervention", backref="type_tache", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom
        }