from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

from dotenv import load_dotenv
from .routes.routes import *
# from .routes.data import data_bp
# from .routes.robot import robot_bp
from database.config import init_db
from .extensions import mail
from app.config import Config


def create_app():
    app = Flask(__name__)
    load_dotenv()
    
    # Configure CORS to handle preflight requests properly
    CORS(app, 
          origins="*",  # Allow all origins for development
          methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allow_headers=["Content-Type", "Authorization"],
          supports_credentials=False)  # Set to False when using origins="*"
    
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")

    app.config.from_object(Config)

    mail.init_app(app)
    # Initialiser la base de données
    init_db(app)

    # Global OPTIONS handler for preflight requests
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = jsonify({"status": "ok"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
            response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
            return response

    # Enregistrer les Blueprints
    app.register_blueprint(all_bp, url_prefix='/api')
    # app.register_blueprint(data_bp, url_prefix='/api/data')
    # app.register_blueprint(robot_bp, url_prefix='/api/robot')

    # Serve static files (PDF reports)
    @app.route('/static/rapports/<path:filename>')
    def serve_rapport_pdf(filename):
        try:
            return send_from_directory('static/rapports', filename)
        except FileNotFoundError:
            return jsonify({"error": "PDF file not found"}), 404

    # Alternative route for PDFs with /app prefix
    @app.route('/app/static/rapports/<path:filename>')
    def serve_rapport_pdf_alt(filename):
        try:
            return send_from_directory('static/rapports', filename)
        except FileNotFoundError:
            return jsonify({"error": "PDF file not found"}), 404

    return app
