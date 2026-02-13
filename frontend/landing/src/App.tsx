import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import OrganizationPage from './pages/OrganizationPage';
import LoginOrganization from './pages/LoginOrganization';
import RegisterOrganization from './pages/RegisterOrganization';

function App() {
  // Determine basename based on current path
  // If accessing /organizations/ directly, use empty basename
  // Otherwise use /landing
  const getBasename = () => {
    if (typeof window !== 'undefined') {
      // In development, run without a basename so
      // http://localhost:5176/ works directly.
      if (import.meta.env.DEV) {
        return '';
      }

      const pathname = window.location.pathname;
      return pathname.startsWith('/organizations/') ? '' : '/landing';
    }
    return '/landing'; // Default for SSR
  };
  
  return (
    <AuthProvider>
      <BrowserRouter basename={getBasename()}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/organizations/:slug" element={<OrganizationPage />} />
          <Route path="/login-organization" element={<LoginOrganization />} />
          <Route path="/register-organization" element={<RegisterOrganization />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

