"Managed by Carl & Marc"
# Imports SqlAlchemy from database.py
from database import db
#Imports current Date and provide timestamp
from datetime import datetime, timezone


class Task(db.Model):
    __tablename__ = 'task'

    id = db.Column(db.Integer, nullble = False, primary_key = True)
    title = db.Column(db.String(255), nullable = False)
    description = db.Column(db.Text, nullable = False)
    budget = db.Column(db.float, nullable = False, )
    skill = db.Column(db.String(255), nullable = False)
    location = db.Column(db.String(255), nullable = False)
    photo_url = db.Column(db.String(500))

    created_at = db.Column(
        db.DateTime(timezone = True),
        nullable = False,
        default = lambda: datetime.now(timezone.utc))

    status = db.Column(
        db.String(30), 
        nullble = False, 
        default = 'open')
    
    deadline = db.Column(
        db.DateTime(timezone = True),
        nullable = False)

    created_at = db.Column(
        db.DateTime(timezone = True),
        nullable = False)

# What we need for Task
"""
id
title
description
budget
skills
location
photo_url
created_at
status (default='open')
deadline
created_at
"""

