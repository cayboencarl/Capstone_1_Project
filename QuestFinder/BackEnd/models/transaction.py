from database import db
from datetime import datetime, timezone

class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, nullable = False, primary_key = True)
    
    task_id = db.Column(
        db.Integer, 
        db.ForeignKey('tasks.id'), 
        nullable = False)

    client_id = db.Column(db.Integer, 
                db.ForeignKey('users.id'), 
                nullable = False)

    worker_id = db.Column(
                db.Integer, 
                db.ForeignKey('users.id'), 
                nullable = False)

    amount = db.Column(db.Float, nullable = False)

    commission = db.Column(db.Float, 
                nullable = False)

    created_at = db.Column(
                db.DateTime, 
                nullable = False, 
                default = lambda: datetime.now(timezone.utc))


"""
id
task_id (foreign key)
client_id (foreign key to users)
worker_id (foreign key to users)
amount (Float)
commission (Float - 10% of amount)
created_at
"""
