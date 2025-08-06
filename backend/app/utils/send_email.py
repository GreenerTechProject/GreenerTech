from flask_mail import Message
from app.extensions import mail  # ✅ BON chemin
from flask import current_app
from app.utils.security import generate_token
from urllib.parse import quote
import os

def send_verification_email(user):
    token = user.verification_token
    token_encoded = quote(token)  # URL encode the token
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    verify_url = f"{frontend_url}/verify-email?token={token_encoded}"  # ou ton vrai frontend

    subject = "Vérification de votre adresse e-mail"
    html = f"""
    <p>Bonjour {user.name},</p>
    <p>Merci de vous être inscrit sur GreenerTech.</p>
    <p>
        Veuillez cliquer sur le lien suivant pour vérifier votre adresse e-mail :<br>
        <a href="{verify_url}">{verify_url}</a>
    </p>
    <p><strong>Ce lien est valide pendant 24 heures.</strong></p>
    <p>L’équipe GreenerTech.</p>
    """
    msg = Message(subject=subject, recipients=[user.email], html=html)
    mail.send(msg)
