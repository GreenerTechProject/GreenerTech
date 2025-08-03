from flask_mail import Message
from app.extensions import mail  # ✅ BON chemin
from flask import current_app
from app.utils.security import generate_token
import os


def send_verification_email(user):
    token = user.verification_token
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    verify_url = f"http://{frontend_url}/verify-email?token={token}"  # ou ton vrai frontend

    subject = "Vérification de votre adresse e-mail"
    body = f"""
Bonjour {user.name},

Merci de vous être inscrit sur GreenerTech.

Veuillez cliquer sur le lien suivant pour vérifier votre adresse e-mail :
{verify_url}

Ce lien est valide pendant 24 heures.

L’équipe GreenerTech.
"""
    msg = Message(subject=subject, recipients=[user.email], body=body)
    mail.send(msg)
