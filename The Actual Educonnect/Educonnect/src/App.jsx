import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { StudyProvider } from './contexts/StudyContext'
import { NLPProvider } from './contexts/NLPContext'
import { AudioReader } from './components/AudioReader'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Recommendations from './pages/Recommendations'
import Feedback from './pages/Feedback'
import AdminUsers from './pages/AdminUsers'
import AdminDashboard from './pages/AdminDashboard'
import AdminQuizAssessments from './pages/AdminQuizAssessments'
import StudyAnalytics from './pages/StudyAnalytics'
import LearningResources from './pages/LearningResources'
import Quiz from './pages/Quiz'
import QuizHub from './pages/QuizHub'
import StudyGroups from './pages/StudyGroups'
import GroupChat from './pages/GroupChat'
import PersonalChat from './pages/PersonalChat'
import WelcomeMessage from './components/WelcomeMessage'
import AtlasBot from './components/AtlasBot'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function StudentRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (!isAdmin) return <Navigate to="/dashboard" />
  return children
}

function AppRoutes() {
  const { user, showWelcome, setShowWelcome, loading } = useAuth()
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'

  // Wait for auth to load (restore session from localStorage) before routing
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--background, #f5f5f5)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: 'var(--primary, #667eea)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary, #6B7280)', fontSize: '0.9rem' }}>Loading EduConnect...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      {user && !isAuthPage && (
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
      )}
      {showWelcome && user && (
        <WelcomeMessage 
          name={user.firstName} 
          onClose={() => setShowWelcome(false)} 
        />
      )}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />} />
        <Route 
          path="/dashboard" 
          element={
            <StudentRoute>
              <Dashboard />
            </StudentRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <StudentRoute>
              <Profile />
            </StudentRoute>
          } 
        />
        <Route 
          path="/profile/:id" 
          element={
            <StudentRoute>
              <Profile />
            </StudentRoute>
          } 
        />
        <Route 
          path="/recommendations" 
          element={
            <StudentRoute>
              <Recommendations />
            </StudentRoute>
          } 
        />
        <Route 
          path="/feedback" 
          element={
            <PrivateRoute>
              <Feedback />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/assessments" 
          element={
            <AdminRoute>
              <AdminQuizAssessments />
            </AdminRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <StudentRoute>
              <StudyAnalytics />
            </StudentRoute>
          } 
        />
        <Route 
          path="/resources" 
          element={
            <StudentRoute>
              <LearningResources />
            </StudentRoute>
          } 
        />
        <Route 
          path="/quiz/:fieldId" 
          element={
            <StudentRoute>
              <QuizHub />
            </StudentRoute>
          } 
        />
        <Route 
          path="/quiz/:fieldId/:quizId" 
          element={
            <StudentRoute>
              <Quiz />
            </StudentRoute>
          } 
        />
        <Route 
          path="/groups" 
          element={
            <StudentRoute>
              <StudyGroups />
            </StudentRoute>
          } 
        />
        <Route 
          path="/groups/chat/:chatRoomId" 
          element={
            <StudentRoute>
              <GroupChat />
            </StudentRoute>
          } 
        />
        <Route 
          path="/chat/dm/:otherUserId" 
          element={
            <StudentRoute>
              <PersonalChat />
            </StudentRoute>
          } 
        />
        <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} replace />} />
      </Routes>
      {user && !isAuthPage && (
        <>
          <AudioReader />
          <AtlasBot />
        </>
      )}
    </>
  )
}

function AppContent() {
  const auth = useAuth()
  return (
    <StudyProvider>
      <NLPProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </NLPProvider>
    </StudyProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

