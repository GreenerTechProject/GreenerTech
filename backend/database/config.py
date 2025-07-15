from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

db = SQLAlchemy()
migrate = Migrate()

def init_db(app):
    from app.models import *  # Import all models so they register with SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL") #localhost :5433
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    migrate.init_app(app, db)
