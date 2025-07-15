from flask import Flask
from flask_cors import CORS

from dotenv import load_dotenv
import os
from .routes.auth import auth_bp
# from .routes.data import data_bp
# from .routes.robot import robot_bp
from database.config import init_db

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
    

    # Initialiser la base de données
    init_db(app)


    # Enregistrer les Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    # app.register_blueprint(data_bp, url_prefix='/api/data')
    # app.register_blueprint(robot_bp, url_prefix='/api/robot')

    return app
