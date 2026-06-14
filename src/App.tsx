import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ClientsPage } from './pages/ClientsPage'
import { SitesPage } from './pages/SitesPage'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/clients"
            element={<ProtectedRoute requireAdmin><ClientsPage /></ProtectedRoute>}
          />
          <Route
            path="/sites"
            element={<ProtectedRoute><SitesPage /></ProtectedRoute>}
          />
          <Route
            path="/media"
            element={<ProtectedRoute><PlaceholderPage title="Media" /></ProtectedRoute>}
          />
          <Route
            path="/analytics"
            element={<ProtectedRoute><PlaceholderPage title="Analytics" /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
