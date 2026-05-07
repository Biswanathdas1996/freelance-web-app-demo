import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import PostJobPage from './pages/PostJobPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LoanLandingPage from './pages/LoanLandingPage';
import CustomerDetailsFormPage from './pages/CustomerDetailsFormPage';
import IncomeDetailsFormPage from './pages/IncomeDetailsFormPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post-job"
            element={
              <ProtectedRoute>
                <PostJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans"
            element={
              <ProtectedRoute>
                <LoanLandingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans/application/:id/customer-details"
            element={
              <ProtectedRoute>
                <CustomerDetailsFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans/application/:id/income-details"
            element={
              <ProtectedRoute>
                <IncomeDetailsFormPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
