# Frontend — Online Birth Certificate Application System

React (Vite) + Tailwind CSS + React Router + Axios + Glassmorphism UI.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and point it at your backend:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173`

## Folder Structure

```
frontend/
  src/
    api/client.js            # Axios instance with JWT bearer token
    context/AuthContext.jsx   # Authentication state provider
    routes/ProtectedRoute.jsx # Role-based route guard
    components/
      Navbar.jsx             # Sticky glass navbar with user avatar badge
      StatusBadge.jsx        # Pill badges with status pulse dots
      LoadingSpinner.jsx     # Dual-ring animated spinner
      EmptyState.jsx         # Illustrated empty states
      PageHeader.jsx         # Gradient page headers
    pages/
      Home.jsx               # Hero landing page with photo gallery
      Login.jsx              # Split-screen login with photo panel
      Register.jsx           # Split-screen register with password meter
      CitizenDashboard.jsx   # Citizen: list & track applications
      NewApplication.jsx     # Citizen: 3-step application wizard
      ApplicationDetail.jsx  # Shared: details, upload, decisions, timeline
      StaffDashboard.jsx     # Ward & District staff review queue
      AdminDashboard.jsx     # Admin: stats, applications, user management
    App.jsx                  # Main routes
    index.css                # Custom CSS design system tokens
  tailwind.config.js         # Extended Tailwind palette & font tokens
  vercel.json                # Vercel SPA rewrite rule
```

## Roles & Access Matrix

| Role | Accessible Pages |
| :--- | :--- |
| **Citizen** | `/dashboard`, `/apply`, `/applications/:id` |
| **Ward Staff** | `/staff/ward`, `/applications/:id` (Approve / Reject / Forward) |
| **District Staff** | `/staff/district`, `/applications/:id` (Final Approve / Reject) |
| **Admin** | `/admin` (Overview, Applications, Create Staff Accounts, Enable/Disable Users) |
