/**
 * VoltLedger Main App Component
 * React Router setup with protected routes
 */

import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { theme } from './styles/theme'
import useAuthStore from './store/authStore'

// Public Pages
import Login from './pages/Login'
import Register from './pages/Register'

// Protected Pages
import Dashboard from './pages/Dashboard'
import Bikes from './pages/Bikes'
import BookLoan from './pages/BookLoan'
import ActiveLoan from './pages/ActiveLoan'
import Payment from './pages/Payment'

// Admin Pages
import { AdminDashboard } from './pages/Admin'

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, initialize } = useAuthStore()
  
  useEffect(() => {
    initialize()
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'agent') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

/**
 * Public Route Component
 * Redirects to dashboard if already authenticated
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, initialize } = useAuthStore()
  
  useEffect(() => {
    initialize()
  }, [])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bikes" 
            element={
              <ProtectedRoute>
                <Bikes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/book-loan" 
            element={
              <ProtectedRoute>
                <BookLoan />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/active-loan" 
            element={
              <ProtectedRoute>
                <ActiveLoan />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment" 
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
