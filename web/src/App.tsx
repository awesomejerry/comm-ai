import { AuthProvider } from './components/AuthProvider';
import PresenterPage from './pages/PresenterPage.full';
import { LoginForm } from './components/LoginForm';
import { LoginRedirect } from './pages/LoginRedirect';
import { Routes, Route } from 'react-router-dom';
import { AuthenticatedRouter } from './components/AuthenticatedRouter';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/login-redirect" element={<LoginRedirect />} />
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
