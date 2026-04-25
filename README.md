# PSG Tech — Elective Portal

A full-stack web application for managing elective subject selection at PSG College of Technology.

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose ODM
- **Auth**: JWT + bcrypt
- **Export**: xlsx (Excel)

---

## Project Structure

```
elective-portal/
├── frontend/               # All frontend files (served as static)
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js          # API helper + token storage
│       ├── auth.js         # Login / register / reset password
│       ├── admin.js        # Admin dashboard logic
│       ├── faculty.js      # Faculty dashboard logic
│       ├── student.js      # Elective selection logic
│       └── app.js          # Routing + theme toggle
│
└── backend/                # All backend/API files
    ├── server.js           # Express entry point
    ├── .env                # Environment variables
    ├── package.json
    ├── config/
    │   ├── db.js           # MongoDB connection
    │   └── seed.js         # Admin seeder
    ├── models/
    │   ├── Admin.js
    │   ├── Faculty.js
    │   └── Student.js
    ├── routes/
    │   ├── auth.js
    │   ├── admin.js
    │   ├── faculty.js
    │   └── student.js
    ├── controllers/
    │   ├── authController.js
    │   ├── adminController.js
    │   ├── facultyController.js
    │   └── studentController.js
    └── middleware/
        └── auth.js         # JWT protect + role restrictor
```

---

## Setup Instructions

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone / Extract the project

```bash
# Navigate into the project
cd elective-portal
```

### 2. Configure Environment Variables

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/elective_portal
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d

# Admin credentials (change before use)
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Admin@123
```

> ⚠️ **Change ADMIN_EMAIL and ADMIN_PASSWORD before seeding!**

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Seed the Admin Account

```bash
npm run seed
```

You should see: `Admin seeded successfully: admin@gmail.com`

### 5. Start the Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The server will start at: **http://localhost:5000**

The frontend is automatically served by Express from the `../frontend` folder.

---

## Running the Application

Open your browser and go to: **http://localhost:5000**

### Admin Login
- Email: `admin@gmail.com` (or what you set in .env)
- Password: `Admin@123` (or what you set in .env)

### Faculty Login
- Onboard via Admin dashboard
- Default password = everything before `@` in their email
  - e.g., `css.mca@psgtech.ac.in` → password is `css.mca`
- Faculty must reset password on first login

### Student Registration
- Register with roll number format: `25MX125` (2 digits + 2 uppercase letters + 3 digits)
- Only `@psgtech.ac.in` emails allowed

---

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/register | Public | Student registration |
| POST | /api/auth/login | Public | Login (all roles) |
| GET | /api/auth/me | Any | Get current user |
| POST | /api/admin/add-faculty | Admin | Add a faculty member |
| GET | /api/admin/faculty | Admin | List all faculty |
| DELETE | /api/admin/faculty/:id | Admin | Remove faculty |
| POST | /api/faculty/reset-password | Faculty | Reset first-login password |
| GET | /api/faculty/electives | Faculty | Get all electives + counts |
| GET | /api/faculty/students-by-elective?name= | Faculty | Students in an elective |
| GET | /api/faculty/export-elective?name= | Faculty | Export to .xlsx |
| GET | /api/faculty/search-student?query= | Faculty | Search students |
| POST | /api/student/select-electives | Student | Submit elective choices |
| GET | /api/student/my-electives | Student | View own selections |

---

## Elective Selection Rules

Students select 4 electives:
- **Elective II, III, IV** — From Categories 1 & 2 combined:
  - **Category 1**: Human Computer Interaction, Computer Networks, DevOps
  - **Category 2**: Data Mining, Smart Computing using Python
  - **Rule**: Must pick exactly 3 subjects total; at least 2 must be from Category 1
  - If all 3 from Category 1 → Category 2 options are disabled
  - If 2 from Category 1 → only 1 from Category 2 allowed
- **Elective V** — Choose one: Entrepreneurship or Accounting

---

## Features

- ✅ JWT authentication with role-based access control
- ✅ bcrypt password hashing
- ✅ Domain restriction (@psgtech.ac.in for students/faculty)
- ✅ Faculty first-login password reset flow
- ✅ Dynamic elective selection with constraint enforcement
- ✅ Excel export for faculty
- ✅ Student search by name or roll number
- ✅ Light / Dark mode toggle
- ✅ Responsive design
- ✅ Server-side validation mirrors client-side rules
