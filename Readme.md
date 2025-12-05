Devign Club Attendance System

A clean, modern, and lightweight attendance-tracking web application built for Devign Club. Members can mark attendance easily, while admins can manage meeting details and delete records. The UI is inspired by Apple’s minimal and playful design language.

FEATURES

MEMBER FEATURES:

Mark attendance with Name, Branch, Year

Smooth, clean form UI

View the list of attendees for the ongoing meeting

ADMIN FEATURES:

PIN-based admin login

Update meeting details (Meeting Date + Agenda)

Delete attendance entries

Clear visual separation between Member mode and Admin mode

UI FEATURES:

Modern, minimal, Apple-like UI

Responsive layout (mobile friendly)

Rolling attendee list (max 5 visible, scrollable)

Optional 3D particle background

BACKEND FEATURES:

Node.js + Express server

REST-based API

JSON file persistence for meeting + attendance data

CORS enabled (Vite + React compatible)

TECH STACK

FRONTEND:

React (Vite)

TailwindCSS

Custom Apple-style layout and micro-interactions

BACKEND:

Node.js

Express

CORS

JSON-based file storage

API ENDPOINTS

MEETING:
GET /api/meeting → Get current meeting info
PUT /api/meeting → Update meeting date + agenda

ATTENDANCE:
GET /api/attendance?meetingDate=YYYY-MM-DD
POST /api/attendance → Add attendance
DELETE /api/attendance/:id → Delete attendance record

PROJECT STRUCTURE

devign-attendance/
backend/
server.js
data/
meeting.json
attendance.json
package.json

frontend/
src/
App.jsx
main.jsx
BackgroundParticles.jsx
index.html
tailwind.config.js
vite.config.js
package.json

SETUP INSTRUCTIONS

Clone the repository:
git clone your-repo-url
cd devign-attendance

Backend setup:
cd backend
npm install
npm run dev
Backend runs on http://localhost:5000

Frontend setup:
cd frontend
npm install
npm run dev
Frontend runs on http://localhost:5173

ADMIN PIN

The default admin PIN is: 1104
This can be modified in App.jsx:

const ADMIN_PIN = "1104";

FUTURE IMPROVEMENTS (OPTIONAL)

Export attendance to CSV/Excel

QR-based attendance scanning

Cloud database (MongoDB/PostgreSQL)

Admin analytics dashboard

Dark mode

Authentication system

LICENSE

Open-source and free to modify for Devign Club internal use.