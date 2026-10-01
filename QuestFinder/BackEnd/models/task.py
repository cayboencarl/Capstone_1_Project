"Managed by Carl & Marc"
# Imports SqlAlchemy from database.py
from database import db
#Imports current Date and provide timestamp
from datetime import datetime, timezone


class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, nullable = False, primary_key = True)
    title = db.Column(db.String(255), nullable = False)
    description = db.Column(db.Text, nullable = False)
    budget = db.Column(db.Float, nullable = False, )
    skills_required = db.Column(db.String(255), nullable = False)
    location = db.Column(db.String(255), nullable = False)
    photo_url = db.Column(db.String(500))

    created_by = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable = False,
        )

    status = db.Column(
        db.String(30), 
        nullable = False, 
        default = 'open')
    
    deadline = db.Column(
        db.DateTime,
        nullable = False)

    created_at = db.Column(
        db.DateTime,
        nullable = False,
        default = lambda: datetime.now(timezone.utc))

# What we need for Task
"""
id
title
description
budget
skills
location
photo_url
created_by
status (default='open')
deadline
created_at
"""

