# Online Birth Certificate Application System 📜

An E-Governance web application for digital birth certificate processing.

Digitizes the complete birth certificate application process: citizens submit application details and upload supporting documents online; ward office staff review, approve, reject, or forward applications; district office staff perform final reviews on forwarded applications; and system administrators manage users, applications, and audit logs.

---

## ✨ Features & UI Highlights

- 🎨 **Modern Design**: Premium glassmorphism design with an indigo palette, Google Fonts (`Inter` + `Plus Jakarta Sans`), and subtle micro-animations.
- 🖼️ **Stock Media**: High-quality newborn and family photography.
- 📱 **Responsive Layout**: Mobile-friendly glass navbar, responsive dashboards, and adaptive forms.
- 🪄 **Multi-Step Wizard**: 3-step application form with progress bar and review step.
- 👑 **Admin Portal**: Inline staff account creation (`ward_staff`, `district_staff`, `admin`), active/disable toggle, and status overrides.
- 🛡️ **Role-Based Workflows**: Separate dashboards and queues for Citizens, Ward Office Staff, District Office Staff, and System Admins.

---

## 🏗️ Architecture

```
.
├── backend/    FastAPI + PostgreSQL (Neon DB) + SQLAlchemy + JWT Auth
└── frontend/   React 18 + Vite + Tailwind CSS + Axios
```

---

## ⚡ Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env    # Configure DATABASE_URL and SECRET_KEY
python seed_admin.py    # Seeds initial database tables and admin account
uvicorn app.main:app --reload --port 8000
```
Backend API docs available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend UI available at: `http://localhost:5173`

---

## 👥 Demo Admin Credentials

- **Email:** `admin@example.com`
- **Password:** `admin123`

---

## 🔄 Roles & Approval Workflow

```
Citizen → Register/Login → Fill 3-Step Application → Upload Documents
        → Ward Office Review → Approve / Reject / Forward
        → District Office Review (if forwarded) → Final Approval
        → Status: "Approved"
```

---

## 🚀 Deployment Guide

### Backend → [Render.com](https://render.com)
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:** `PYTHON_VERSION=3.11.9`, `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_ORIGINS`

### Frontend → [Vercel.com](https://vercel.com)
- **Root Directory:** `frontend`
- **Framework Preset:** `Vite`
- **Environment Variables:** `VITE_API_BASE_URL=https://<your-render-backend-url>/api`
- Includes `vercel.json` for SPA route rewriting.
