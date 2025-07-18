# app/models/serre.py
from sqlalchemy import Column, Integer, String, Date, ForeignKey
from database.config import db

class Serre(db.Model):
    __tablename__ = "serres"

    id = Column(Integer, primary_key=True, index=True)
    nom_serre = Column(String, nullable=False)
    id_group_cor = Column(Integer, nullable=False)
    date_creation = Column(Date, nullable=False)
    id_domaine = Column(Integer, ForeignKey('domaines.id'), nullable=False)
