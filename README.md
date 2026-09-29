# QuestFinder

### A Barangay-Based Platform for Short-Term Task Opportunities

QuestFinder is a **barangay-exclusive web platform** designed to connect homeowners and small business owners with verified residents who are willing to perform short-term tasks within **Barangay San Vicente**.

The platform aims to provide clients with a centralized way to find people for small or temporary tasks while giving verified residents access to flexible local job opportunities.

---

## Project Overview

Homeowners and small business owners often need help with short-term tasks such as cleaning, delivery, basic maintenance, errands, and other small jobs.

However, finding someone reliable for these tasks can be difficult, especially when the task is too small or temporary to justify hiring a regular worker.

Currently, clients may rely on:

* Word-of-mouth
* Personal connections
* Facebook posts and groups
* Group chats
* Informal recommendations

These methods are often scattered and provide limited information about the people offering to perform the task.

QuestFinder addresses this problem by providing a **centralized and barangay-exclusive platform** where clients can post tasks and connect with **verified residents of Barangay San Vicente**.

---

## Main Problem

> **Homeowners and small business owners in Barangay San Vicente have difficulty finding reliable people to perform short-term tasks, especially when the tasks are too small or temporary to justify hiring a regular worker.**

---

## Proposed Solution

QuestFinder provides a centralized platform where:

1. Clients post short-term tasks.
2. Verified residents browse available tasks.
3. Residents apply for tasks they are interested in.
4. Clients review the applicants.
5. Clients select a suitable task worker.
6. The task is performed.
7. The client confirms task completion.
8. The transaction is completed through the platform.
9. QuestFinder receives a 10% commission from the completed transaction.

The platform also allows the **Barangay San Vicente administration** to verify resident accounts before residents can participate as task workers.

---

# User Roles

QuestFinder has three primary roles.

## Client

The primary target users of QuestFinder are:

* Homeowners
* Small business owners

Clients can:

* Create an account
* Post tasks
* Set task details and compensation
* View applicants
* Review applicant information
* Select a task worker
* Track task progress
* Confirm task completion
* Complete payment
* Rate task workers
* Report problems

---

## Task Worker

Task workers are **residents of Barangay San Vicente who are 18 years old or above**.

Before becoming a task worker, the resident's account must be reviewed and approved by the barangay.

Verified task workers can:

* Browse available tasks
* Search and filter tasks
* View task details
* Apply for tasks
* Communicate with clients
* Track their applications
* Perform accepted tasks
* Receive payment
* View completed tasks
* Receive ratings/reviews

---

## Barangay Administrator

The barangay serves as the **resident verification and administrative authority**.

Barangay administrators can:

* Review resident registrations
* Verify residency
* Approve or reject registrations
* Manage verified residents
* Suspend or deactivate accounts when necessary
* Review reports
* Monitor platform activity
* View community-level statistics

### Important

Barangay verification confirms that a user is a verified resident of Barangay San Vicente.

It does **not** guarantee that the resident is personally trustworthy or that every task they perform will be successful.

QuestFinder can support trust through:

* Ratings
* Reviews
* Completed task history
* Reports
* Account status
* Task history

---

# How QuestFinder Works

### 1. Resident Registration

A resident creates an account and submits the required information.

```text
Resident
   ↓
Creates Account
   ↓
Barangay Review
   ↓
Approved / Rejected
```

Only approved residents can participate as task workers.

---

### 2. Client Posts a Task

A client creates a task containing information such as:

* Task title
* Description
* Location
* Budget
* Required qualifications
* Estimated duration
* Deadline
* Optional image

Example:

> **Task:** Yard Cleaning
> **Location:** Barangay San Vicente
> **Budget:** ₱500
> **Duration:** Approximately 2 hours

---

### 3. Task Worker Applies

Verified residents can browse available tasks and submit applications.

```text
Available Task
      ↓
Resident Views Task
      ↓
Resident Applies
      ↓
Application Sent to Client
```

---

### 4. Client Selects a Worker

The client reviews applicants and chooses the person they want to perform the task.

```text
Client
  ↓
Reviews Applicants
  ↓
Selects Task Worker
  ↓
Task Begins
```

---

### 5. Task Completion

The selected task worker performs the task.

Once the task is finished, the client confirms completion.

```text
Task Accepted
      ↓
In Progress
      ↓
Completed
      ↓
Client Confirmation
```

---

### 6. Payment

The transaction is completed through the platform.

QuestFinder currently plans to generate revenue through a:

> **10% commission on successfully completed transactions.**

Example:

```text
Task Value: ₱500

Task Worker: ₱450
QuestFinder: ₱50
```

The exact payment and commission implementation may be adjusted depending on the final payment gateway and system requirements.

---

# Revenue Model

## 10% Transaction Commission

QuestFinder's primary revenue model is a **10% commission for successfully completed transactions facilitated through the platform**.

This means QuestFinder earns revenue only when a successful task transaction takes place.

### Example

If a client posts a task worth:

**₱500**

QuestFinder receives:

**₱50**

as its 10% platform commission.

The remaining amount goes to the task worker according to the platform's finalized payment structure.

### Possible Future Revenue Streams

Future versions may explore:

* Barangay system licensing
* Premium client features
* Featured task listings
* Business accounts
* Subscription-based administrative features

These are not part of the current core MVP unless required.

---

# Core Features

## Authentication

* User registration
* User login
* Role-based access
* Account verification
* Password security
* Account status management

## Resident Verification

* Pending verification status
* Barangay review
* Approval/rejection
* Verified resident status
* Account management

## Task Management

* Create task
* Edit task
* Delete/cancel task
* View task
* Task status
* Task history

## Task Discovery

* Browse available tasks
* Search tasks
* Filter tasks
* View task details

## Applications

* Apply for task
* View applications
* Review applicants
* Accept/select applicant
* Track application status

## Transactions

* Track transaction status
* Confirm task completion
* Process payment
* Calculate platform commission
* Record transaction history

## Ratings and Reports

* Rate task workers
* Leave reviews
* Report users
* Report tasks
* Account moderation

## Barangay Administration

* Review registrations
* Verify residents
* Manage residents
* Monitor platform activity
* View statistics
* Manage reports

---

# System Architecture

QuestFinder follows a client-server architecture.

```text
┌───────────────────────────┐
│        Frontend           │
│                           │
│  Web Browser / UI         │
└─────────────┬─────────────┘
              │
              │ HTTP Requests
              ↓
┌───────────────────────────┐
│         Backend           │
│                           │
│  Authentication           │
│  Business Logic           │
│  Task Management          │
│  Applications             │
│  Transactions             │
│  User Verification        │
└─────────────┬─────────────┘
              │
              │ Database Queries
              ↓
┌───────────────────────────┐
│         Database          │
│                           │
│  Users                    │
│  Tasks                    │
│  Applications             │
│  Transactions             │
│  Reviews                  │
│  Reports                  │
└───────────────────────────┘
```

---

# Technology Stack

> Update this section according to the technologies your group finally chooses.

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Python
* Flask

### Database

* PostgreSQL

### API

* REST API

### Version Control

* Git
* GitHub

### Development Tools

* Visual Studio Code
* Postman
* pgAdmin

### Deployment

To be determined based on the final deployment architecture.

Possible services include:

* Vercel
* Railway
* Supabase

---

# Suggested Project Structure

```text
QuestFinder/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   └── assets/
│
├── backend/
│   ├── app.py
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── database/
│   └── config/
│
├── docs/
│   ├── system-design/
│   ├── diagrams/
│   └── documentation/
│
├── tests/
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

---

# Security and Privacy

Because QuestFinder handles user accounts and resident verification, security and privacy are important parts of the system.

The system should follow the principle of **collecting only information necessary for the platform to function**.

Security considerations include:

* Password hashing
* Authentication
* Role-based authorization
* Input validation
* API authentication
* Protection against unauthorized access
* Secure handling of user information
* Appropriate database access controls
* Protection of payment-related information

Sensitive information should not be stored unless it is necessary for the system's operation and properly handled.

---

# Initial Scope

The initial implementation of QuestFinder focuses on:

> **Barangay San Vicente**

The platform is intended for:

### Clients

* Homeowners
* Small business owners

### Task Workers

* Barangay San Vicente residents
* 18 years old and above
* Barangay-verified accounts

The barangay-exclusive scope allows the project to focus on a manageable community while establishing a controlled environment for testing and evaluation.

---

# MVP Scope

The Minimum Viable Product will focus on the core workflow:

```text
Register
   ↓
Barangay Verification
   ↓
Login
   ↓
Post Task
   ↓
Browse Tasks
   ↓
Apply
   ↓
Select Worker
   ↓
Complete Task
   ↓
Confirm Completion
   ↓
Transaction
   ↓
Rating
```

Features outside this workflow may be considered for future versions.

---

# Future Development

Possible future improvements include:

* Expansion to other barangays
* Mobile application
* Real-time chat
* Advanced location/map integration
* Improved recommendation system
* Automated fraud detection
* Advanced analytics
* Worker skill verification
* Business subscription plans
* Multiple barangay management
* More payment methods
* Notification system

---

# Project Goals

QuestFinder aims to:

1. Provide homeowners and small business owners with a centralized platform for finding people for short-term tasks.
2. Provide residents with access to flexible local work opportunities.
3. Establish a barangay-based resident verification system.
4. Reduce reliance on informal methods such as word-of-mouth and scattered social media posts.
5. Provide a structured process for posting, applying for, and completing short-term tasks.
6. Create a sustainable revenue model through transaction commissions.

---

# Project Status

**Status:** In Development

QuestFinder is currently being developed as an academic capstone project.

The system design, features, technology stack, and business model may be modified as development and user research progress.

---

# Development Team

**QuestFinder Development Team**

* Cayboen, Carl A.
* Icasiam, Marc
* Hernandez, Aldous

---

# 📄 License

This project is developed for academic purposes.

License and usage terms may be updated if QuestFinder is deployed as a production system.
