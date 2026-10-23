# QuestFinder

A barangay-based web platform that connects homeowners and small business owners in **Barangay San Vicente, Baguio City** with verified residents who can perform short-term tasks.

> Capstone project, CIT16 – IT Technopreneurship, 3rd Trimester, AY 2025–2026
> Team: Carl (Backend: users and tasks), Marc (Backend: applications and task status), Aldous (Frontend)

---

## The Problem

Homeowners and small business owners often need help with small, temporary jobs such as cleaning, carrying, basic maintenance, or errands. These jobs are often too small to justify hiring a regular worker, and finding a reliable person usually relies on word of mouth and scattered social media posts.

QuestFinder provides one place to post these tasks, browse them, apply, choose a worker, and keep a record of the completed work.

---

## Scope

- **Location:** Barangay San Vicente, Baguio City
- **Clients:** Homeowners and small business owners
- **Workers:** Residents aged 18 and above, verified by the barangay at registration
- **Revenue model (planned):** 10% commission on completed transactions. The MVP records agreed amounts. It does not process real payments.

Not included in the current version: blockchain, real-time location tracking, a payment gateway, premium features, and an admin dashboard.

---

## How It Works

1. A resident registers. The account is marked `unverified` until it is approved.
2. A client posts a task with a title, description, location, skills required, budget, deadline, and an optional photo.
3. Verified workers browse and search open tasks.
4. A worker applies with a short message.
5. The client reviews applications and accepts one. The others are rejected.
6. The accepted worker performs the task and marks it as completed.
7. The client confirms completion.
8. The completed task and its agreed amount are recorded as a transaction.

Task status flow: `open → in_progress → completed`

Application status flow: `pending → accepted / rejected`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask |
| Database | PostgreSQL |
| ORM | Flask-SQLAlchemy (SQLAlchemy) |
| Database driver | psycopg2-binary |
| Config | python-dotenv (`.env` file) |
| API style | REST, JSON |
| Frontend | HTML, CSS, JavaScript |
| Version control | Git and GitHub |

---

## Project Structure

```
QuestFinder/
├── BackEnd/
│   ├── models/              # Database tables (SQLAlchemy models)
│   │   ├── __init__.py
│   │   ├── user.py          # User
│   │   ├── task.py          # Task
│   │   ├── application.py   # Application
│   │   └── transaction.py   # Transaction
│   ├── routes/              # API endpoints (Flask blueprints)
│   │   ├── users.py
│   │   ├── tasks.py
│   │   └── applications.py
│   ├── services/            # Business logic (validation, filtering, status rules)
│   │   ├── user_service.py
│   │   ├── task_service.py
│   │   └── application_service.py
│   ├── app.py               # Application factory (create_app)
│   ├── config.py            # Settings loaded from .env
│   ├── database.py          # Shared db object and init_db()
│   └── run.py               # Entry point
├── FrontEnd/
│   └── index.html
├── .env.example             # Template for required environment variables
├── .gitignore
├── requirements.txt
└── README.md
```

**Why it is organized this way:** Models define data, routes handle HTTP requests and responses, and services hold the rules (for example, "only the client who owns a task can change its status"). Keeping these separate makes the code easier to read, test, and merge when several people work on it.

---

## Setup

### Requirements

- Python 3.10 or newer
- PostgreSQL (with a database named `questfinder`)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/QuestFinder.git
cd QuestFinder/BackEnd
```

### 2. Create and activate a virtual environment

Windows (Command Prompt or PowerShell):
```cmd
python -m venv venv
venv\Scripts\activate
```

Git Bash:
```bash
python -m venv venv
source venv/Scripts/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/questfinder
SECRET_KEY=change-this-to-a-random-string
```

Never commit `.env`. It is listed in `.gitignore`.

### 5. Run the server

```bash
python run.py
```

The API runs at `http://localhost:5000`. On startup, the tables are created in PostgreSQL if they do not exist.

---

## API Endpoints (MVP)

All endpoints return JSON.

### Users (Carl)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users` | Register a user (client or worker) |
| GET | `/api/users/<id>` | Get a user profile |
| PUT | `/api/users/<id>` | Update a user profile |

### Tasks (Carl)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tasks` | Create a task (clients only) |
| GET | `/api/tasks` | List tasks. Supports `?status=open` |
| GET | `/api/tasks?search=keyword` | Search tasks by keyword in title |
| GET | `/api/tasks/<id>` | Get task details |
| PUT | `/api/tasks/<id>` | Update a task (owning client only) |

### Applications (Marc)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/applications` | Worker applies to a task |
| GET | `/api/applications` | List applications |
| GET | `/api/applications?task_id=<id>` | Applications for one task |
| PUT | `/api/applications/<id>` | Accept or reject an application (client only) |

### Task status (Marc)

| Method | Endpoint | Description |
|---|---|---|
| PUT | `/api/tasks/<id>/status` | Move a task through `open → in_progress → completed` |

### Example request

```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Yard Cleaning",
  "description": "Clear leaves and trim the hedge in the backyard",
  "budget": 500,
  "skills_required": "gardening, physical labor",
  "location": "Purok 3, Barangay San Vicente",
  "deadline": "2026-11-15T12:00:00"
}
```

---

## Team Responsibilities

| Member | Area |
|---|---|
| Carl | User management, task management, shared models and setup |
| Marc | Applications, task status workflow, transactions |
| Aldous | Frontend (HTML, CSS, JavaScript) |

Shared: database migrations, error handling, testing, documentation.

### Git workflow

- Work on your own branch (`feature/users-tasks`, `feature/applications`, `feature/frontend`).
- Make small commits with clear messages.
- Pull and merge `main` regularly. Test after merging.
- Do not commit `.env`, `venv/`, or `__pycache__/`.

---

## Testing

Test each endpoint with Postman or curl before merging. A feature counts as done only when:

- It works through the actual API, not only in Python code.
- Invalid input returns a clear error with the right status code (400, 401, 403, 404).
- Users can only change records they own.

---

## Known Limitations

- Passwords and login are part of the later phase and are not yet protected by authentication.
- Worker verification is recorded as a status. It does not represent an approval process the barangay has formally agreed to.
- Payments are recorded, not processed.
- Matching is planned in stages: rule-based skill matching first, then location filtering, then AI-assisted matching if time allows.

---

## License

Developed for academic purposes.
