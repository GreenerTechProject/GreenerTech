import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')  # à personnaliser
    MAIL_SERVER = 'sandbox.smtp.mailtrap.io'
    MAIL_PORT = 2525
    MAIL_USERNAME ='e061372fd9c1c2'
    MAIL_PASSWORD ='4ede236e82a032'
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_DEFAULT_SENDER = 'noreply@greenertech.com'
