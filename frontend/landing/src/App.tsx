import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import OrganizationPage from './pages/OrganizationPage';
import LoginOrganization from './pages/LoginOrganization';
import RegisterOrganization from './pages/RegisterOrganization';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/landing">
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

