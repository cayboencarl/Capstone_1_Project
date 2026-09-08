import os
from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv

# Loads .env file 
load_dotenv()

#Creates Flask App(after loading.env)
app = Flask(__name__)

#Configures the Database(after creating app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

#Initializes the Database (after config)
db = SQLAlchemy(app)

#Enable Cors(after db)
CORS(app)

#=======================================================MODELS==================================================================
#Creates table for Task
class Task(db.Model):
    __tablename__ = 'tasks'

    #Table contents
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    budget = db.Column(db.Float, nullable=False)
    deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(10), default='open')
    category = db.Column(db.String(50), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    #Turns Task to python dictionary for JSON to read
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'budget': self.budget,
            'deadline': self.deadline,
            'status': self.status,
            'category': self.category,
            'client_id': self.client_id,
            'created_at': self.created_at
        }

#Creates Table for Application
class Application(db.Model):
    __tablename__ = 'applications'

    #Table Contents
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(10), default='pending')
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return{
            'id': self.id,
            'task_id': self.task_id,
            'student_id': self.student_id,
            'status' : self.status,
            'created_at' : self.created_at
            }


#Creates Table for User
class User(db.Model):
    __tablename__ = 'users'

    #Table Contents
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    user_type = db.Column(db.String(100), nullable=False)  # 'client' or 'student'
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    #Turns Task to python dictionary for JSON to read
    def to_dict(self):
        return{
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'user_type': self.user_type,
            'created_at': self.created_at
        }
    
# ==================== ROUTES ====================
#For Testing API
@app.route('/api/health', methods=['GET'])
def health():
    """Test route to verify API is running"""
    return {'message': 'QuestFinder API is running!', 'status': 'ok'}, 200

#For Creating Task
#Routes POST to create task 
@app.route('/api/tasks', methods = ['POST'])
def create_task():
    """Create a new task"""
    #Get Data from request
    data = request.json
    new_task = Task (title = data['title'],
                    description = data['description'],
                    budget = data['budget'],
                    deadline = data['deadline'],
                    category = data['category'],
                    client_id = data['client_id'])
    db.session.add(new_task)
    db.session.commit()
    return{
        'message': 'Task created successfully',
        'task': new_task.to_dict()
    }, 201

#For Creating User
#Routes POST to create user
@app.route('/api/users', methods=['PoST'])
def create_user():
        """Create a new user"""
        data = request.json
        new_user = User(username = data['username'],
                        email = data['email'],
                        full_name = data['full_name'],
                        user_type = data['user_type'],
                        )
        db.session.add(new_user)
        db.session.commit()
        return{
            'message': 'User created successfully',
            'user': new_user.to_dict()
        }, 201

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks or search by keyword"""
    
    # Get search parameter (might be None)
    search = request.args.get('search')
    
    # If search is provided, filter
    # If NOT provided, get all
    if search:
        tasks = Task.query.filter(Task.title.contains(search)).all()
    else: 
        tasks = Task.query.all()
    # Convert to JSON
    tasks_data = [task.to_dict() for task in tasks]
        
    
    # Return response
    return{
        'tasks': tasks_data,
        'count': len(tasks)
    }, 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully!")
    
    app.run(debug=True, host='localhost', port=5000)

