import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import CitizenDashboard from './pages/CitizenDashboard.jsx'
import NewApplication from './pages/NewApplication.jsx'
import ApplicationDetail from './pages/ApplicationDetail.jsx'
import StaffDashboard from './pages/StaffDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apply"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <NewApplication />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications/:id"
          element={
            <ProtectedRoute>
              <ApplicationDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/ward"
          element={
            <ProtectedRoute allowedRoles={['ward_staff']}>
              <StaffDashboard queue="ward" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/district"
          element={
            <ProtectedRoute allowedRoles={['district_staff']}>
              <StaffDashboard queue="district" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}
