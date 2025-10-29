import { AuthProvider } from './components/AuthProvider';
import PresenterPage from './pages/PresenterPage.full';
import { LoginForm } from './components/LoginForm';
import { LoginRedirect } from './pages/LoginRedirect';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { Routes, Route } from 'react-router-dom';
import { AuthenticatedRouter } from './components/AuthenticatedRouter';
import { AdminRoute } from './components/AdminRoute';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/login-redirect" element={<LoginRedirect />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/*"
          element={
            <AuthenticatedRouter>
              <PresenterPage />
            </AuthenticatedRouter>
          }
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;
