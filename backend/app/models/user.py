# models/user.py
from database.config import db
from datetime import datetime
from sqlalchemy import ForeignKey

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    id_assigned = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)


    def __repr__(self):
        return f"<User {self.email}>"
