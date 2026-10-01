#Imports the SqlAlchemy from database.py
from database import db
#Imports current Date and provide timestamp
from datetime import datetime, timezone


class User (db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(100), nullable = False)
    age = db.Column(db.Integer, nullable = False)
    address = db.Column(db.String(255), nullable = False)
    username = db.Column(db.String(255), unique = True, nullable = False)
    password = db.Column(db.String(255), nullable = False)
    email = db.Column(db.String(100), unique=True, nullable = False)

    # client / worker / admin
    user_type = db.Column(
        db.String(30), 
        nullable = False, 
        default = 'worker')
    
    # verification_status (unverified / approved / rejected)
    verification_status = db.Column(
        db.String(30), 
        nullable = False, 
        default = 'unverified')
    
    created_at = db.Column(
        db.DateTime(timezone = True),
        nullable = False, 
        default = lambda: datetime.now(timezone.utc))

# What we need from the User
"""
- id
- name
- age
- address
- username
- password (hashed)
- email
- user_type (client / worker / admin)
- verification_status (unverified / approved / rejected)
- created_at
"""