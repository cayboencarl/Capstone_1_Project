from flask import Flask
from flask_cors import CORS
from config import Config
from database import db

def create_app():
    app = Flask(__name__)
    
    # Load config
    app.config.from_object(Config)
    
    # DON'T init db here - it's done in run.py
    
    # Enable CORS
    CORS(app)
    
    # Import models (so SQLAlchemy knows about them)
    from models import User, Task, Application, Transaction
    
    return app