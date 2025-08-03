from flask import Flask
from flask_cors import CORS

from dotenv import load_dotenv
import os
from .routes.routes import *
# from .routes.data import data_bp
# from .routes.robot import robot_bp
from database.config import init_db
from .extensions import mail
from app.config import Config


def create_app():
    app = Flask(__name__, static_folder='app/static', static_url_path='/static')
    load_dotenv()
    CORS(app)
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")

    app.config.from_object(Config)

    mail.init_app(app)
    # Initialiser la base de données
    init_db(app)

    # Enregistrer les Blueprints
    app.register_blueprint(all_bp, url_prefix='/api')
    # app.register_blueprint(data_bp, url_prefix='/api/data')
    # app.register_blueprint(robot_bp, url_prefix='/api/robot')
    return app
