# Backend — Online Birth Certificate Application System

FastAPI + PostgreSQL + SQLAlchemy + JWT auth.

## Setup

1. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   # PowerShell: .\venv\Scripts\Activate.ps1
   # CMD: venv\Scripts\activate.bat
   # macOS/Linux: source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Create a PostgreSQL database, e.g. `birth_certificate_db`.

3. Copy `.env.example` to `.env` and update `DATABASE_URL`, `SECRET_KEY`, etc.

4. Seed the first admin account:
   ```bash
   python seed_admin.py
   ```
   Default login: `admin@example.com` / `admin123` (change after first login).

5. Run the dev server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

6. Interactive API docs: http://localhost:8000/docs

## Folder structure

```
backend/
  app/
    core/         # config, database session, security (hashing, JWT)
    models/        # SQLAlchemy models (User, Application, Document, AuditLog)
    schemas/       # Pydantic request/response schemas
    api/           # routers: auth.py, applications.py, admin.py
    deps.py        # auth dependencies / role guards
    main.py        # FastAPI app instance
  uploads/          # uploaded documents saved here
  seed_admin.py     # creates the first admin user
  requirements.txt
  .env.example
```

## Roles

- `citizen` — register/login, submit application, upload documents, track status
- `ward_staff` — review new applications: approve / reject / forward to district
- `district_staff` — review forwarded applications: final approve / reject
- `admin` — manage users, view all applications & audit logs, view stats

## Key endpoints

| Method | Path                                       | Role(s)                    |
|--------|---------------------------------------------|-----------------------------|
| POST   | /api/auth/register                          | public (creates citizen)   |
| POST   | /api/auth/login                             | public                      |
| GET    | /api/auth/me                                | any logged-in user          |
| POST   | /api/applications                           | citizen                     |
| GET    | /api/applications/my                        | citizen                     |
| POST   | /api/applications/{id}/documents            | citizen                     |
| GET    | /api/applications/{id}                      | owner / staff / admin       |
| GET    | /api/applications/queue/ward                | ward_staff                  |
| POST   | /api/applications/{id}/ward-decision        | ward_staff                  |
| GET    | /api/applications/queue/district            | district_staff               |
| POST   | /api/applications/{id}/district-decision    | district_staff               |
| GET    | /api/admin/users                            | admin                       |
| POST   | /api/admin/users                            | admin (create staff/admin)  |
| GET    | /api/admin/applications                     | admin                       |
| GET    | /api/admin/stats                            | admin                       |

## Notes for Antigravity IDE

This is a plain FastAPI project with a standard `app/` package layout, so it should
open and run without extra configuration. Point the run/debug config at
`uvicorn app.main:app --reload` with the working directory set to `backend/`.
