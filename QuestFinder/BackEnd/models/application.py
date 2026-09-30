"Managed by Carl & Marc"
from database import db
from datetime import datetime, timezone

class application(db.Model):
    __tablename__ = 'applications'

    id = db.Column(db.Integer, nullable = False, primary_key = True)

    user_id = db.Column(
        db.Integer, 
        db.ForeignKey('users.id'))
    
    task_id = db.Column(
        db.Insteger, 
        db.ForeignKey('tasks.id'))

    status = db.Column(
        db.String(30), 
        db.ForeignKey('tasks.status'),
        default = 'pending')

    message = db.Column(
        db.Text, 
        nullable = True)

    created_at = db.Column(
        db.DateTime, 
        nullable = False, 
        default = lambda: datetime.now(timezone.utc))



"""
id
user_id
task_id
status (pending, accepted, rejected) - default='pending'
message (Text field - worker's message)
created_at (DateTime - when they applied)
"""



