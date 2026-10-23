# QuestFinder Roadmap

**Scope:** Barangay San Vicente, Baguio City
**Start:** October 23, 2026
**Target:** Early December 2026 (confirm exact date with the adviser)

The guiding rule: finish the end-to-end task workflow first. Matching features and extras come only after that workflow works.

---

## Principles

1. **Working beats impressive.** A feature counts as done only when it works through the API and has been tested.
2. **Core first.** Registration, tasks, applications, selection, completion, and records come before matching and extras.
3. **Integrate early.** Frontend and backend are tested together each week, not in the final week.
4. **Cut scope before quality.** If time runs short, drop optional features before dropping validation, permissions, or testing.

---

## Phase 0 — Scope and Audit (Oct 23–27)

**Goal:** Everyone agrees on what the MVP is and what already works.

- [ ] Update all project documents to Barangay San Vicente (status document, study letter, title, problem statement)
- [ ] Confirm open decisions: client verification, worker residency rule, commission recorded or collected
- [ ] Audit the repository and mark each feature as Working, Partial, Not started, or Blocked
- [ ] Confirm the database models: User, Task, Application, Transaction (done in code)
- [ ] Confirm the project structure: `models/`, `routes/`, `services/`, `app.py`, `config.py`, `database.py`, `run.py` (done in code)
- [ ] Freeze the API list in the README

**Exit check:** Everyone has the same checklist and the same MVP definition.

---

## Phase 1 — Core Backend (Oct 28–Nov 3)

**Goal:** Clients can post tasks, and workers can apply.

### Carl
- [x] Database connection (`database.py`, `config.py`, `run.py`)
- [x] User model
- [x] Task model
- [x] Application and Transaction models (shared)
- [ ] `POST /api/users` (register, without login)
- [ ] `GET /api/users/<id>`
- [ ] `PUT /api/users/<id>`
- [ ] `POST /api/tasks`
- [ ] `GET /api/tasks` (with `?status=` filter)
- [ ] `GET /api/tasks/<id>`
- [ ] `PUT /api/tasks/<id>` (owning client only)
- [ ] Input validation for all user and task fields

### Marc
- [ ] `POST /api/applications`
- [ ] `GET /api/applications`
- [ ] `GET /api/applications?task_id=<id>`
- [ ] `PUT /api/applications/<id>` (accept or reject, client only)
- [ ] Rule: a task can have only one accepted application

**Exit check:** A client creates a task, and a worker applies to it, both through the API.

---

## Phase 2 — Core Workflow (Nov 4–10)

**Goal:** The full journey works from post to record.

- [ ] `PUT /api/tasks/<id>/status` (`open → in_progress → completed`)
- [ ] Rule: only the accepted worker can start work
- [ ] Rule: only the client can confirm completion
- [ ] Accepting an application moves the task to `in_progress`
- [ ] Completed tasks create a Transaction record (agreed amount and 10% commission figure)
- [ ] Simple verification status for workers (`unverified`, `approved`, `rejected`) and a route to approve or reject
- [ ] Rule: unverified workers cannot apply

**Exit check:** One scenario runs end to end: post → apply → accept → start → complete → confirm → record.

---

## Phase 3 — Matching and Location (Nov 11–17)

**Goal:** Workers see relevant tasks first.

### Step 1: Rule-based matching (first)
- [ ] Compare the task's required skills with the worker's listed skills
- [ ] Filter tasks by keyword in the title (already designed in `search_tasks`)
- [ ] Return tasks sorted by skill match count

### Step 2: Location filtering (second)
- [ ] Store the task location as a San Vicente purok or street
- [ ] Filter tasks by location
- [ ] Optional: let workers save preferred locations

### Step 3: AI-assisted matching (only if Steps 1 and 2 are stable)
- [ ] Choose one approach (for example, comparing skill descriptions with a text-similarity method or an AI API)
- [ ] Add a fallback to rule-based matching when the AI service fails
- [ ] Test whether the suggestions are relevant using sample tasks

**Exit check:** A worker searching for "gardening" sees gardening tasks in San Vicente first, and the search still works if the AI step is turned off.

---

## Phase 4 — Integration and Testing (Nov 18–24)

**Goal:** Frontend and backend work together reliably.

- [ ] Aldous connects the frontend forms and lists to the API
- [ ] Test every endpoint with Postman or curl
- [ ] Test invalid input (empty fields, negative budget, wrong IDs) and confirm proper error codes
- [ ] Test permissions (a worker cannot accept applications, a client cannot apply)
- [ ] Fix integration bugs found in testing
- [ ] Merge all feature branches into `main` and test again

**Exit check:** The team can run the full demo from a clean database without manual fixes.

---

## Phase 5 — Stabilize and Document (Nov 25–Dec 1)

**Goal:** A stable, demonstrable version.

- [ ] Fix high-priority bugs
- [ ] Prepare demo accounts (two clients, three workers) and sample tasks for San Vicente
- [ ] Finalize README and setup instructions
- [ ] Prepare a backup demo plan (screenshots or recorded walkthrough) in case the server fails
- [ ] Confirm each claimed feature was actually tested

---

## Phase 6 — Buffer and Presentation (Dec 2–7, if the deadline allows)

- Testing and corrections only
- No new large features
- Presentation rehearsal

---

## Not in Scope (for this version)

- Login with passwords and JWT tokens (planned after the MVP; the professor set this as lowest priority)
- Admin dashboard and suspension tools
- Ratings and reviews
- Real payment processing or payment gateway integration
- Premium features
- Real-time chat and notifications
- Blockchain
- Live location tracking and route optimization
- Expansion beyond Barangay San Vicente

These can be listed as future work in the report.

---

## Ownership Summary

| Area | Owner | Phase |
|---|---|---|
| Models, database setup | Carl (done) | 0 |
| User endpoints | Carl | 1 |
| Task endpoints | Carl | 1 |
| Application endpoints | Marc | 1 |
| Task status workflow, transactions | Marc | 2 |
| Verification status | Carl and Marc | 2 |
| Rule-based matching | Carl | 3 |
| Location filtering | Carl | 3 |
| AI-assisted matching (optional) | Marc | 3 |
| Frontend | Aldous | 1–5 |
| Integration testing | Everyone | 4 |
| Documentation | Everyone | 5 |

---

## Risks and Responses

| Risk | Response |
|---|---|
| Scope drifts back to Baguio City | Confirm San Vicente in writing in Phase 0 |
| AI added before the core works | Phase 3 starts only after Phase 2 exit check passes |
| Features claimed but not working | Every item needs a test before it is marked done |
| Merge conflicts in shared files | Separate branches, pull often, agree on file ownership |
| Too many extras | Anything outside the MVP goes to "Not in Scope" |
