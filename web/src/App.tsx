import { AuthProvider } from './components/AuthProvider';
import PresenterPage from './pages/PresenterPage.full';
import { QAPage } from './pages/QAPage';
import { LoginForm } from './components/LoginForm';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { Routes, Route } from 'react-router-dom';
import { AuthenticatedRouter } from './components/AuthenticatedRouter';
import { AdminRoute } from './components/AdminRoute';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const App: React.FC = () => {
  console.log('App component rendered');
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
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
          path="/qa/:evaluationId"
          element={
            <AuthenticatedRouter>
              <QAPage />
            </AuthenticatedRouter>
          }
        />
        AAAAA BBBBB
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
