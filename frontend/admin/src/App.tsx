import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import MenuManagement from './pages/MenuManagement';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Organizations from './pages/SuperAdmin/Organizations';
import Locations from './pages/SuperAdmin/Locations';
import Pos from './pages/Pos';
import CashierScreen from './pages/CashierScreen';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './App.css';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Cashier Screen - Full width, no sidebar */}
      <Route
        path="/cashier"
        element={
          <ProtectedRoute>
            <CashierScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="branches" element={<Branches />} />
        <Route path="menu" element={<Navigate to="/menu/categories" replace />} />
        <Route path="menu/categories" element={<MenuManagement />} />
        <Route path="menu/items" element={<MenuManagement />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="pos" element={<Pos />} />
        <Route path="super-admin/organizations" element={<Organizations />} />
        <Route path="super-admin/locations" element={<Locations />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <Router basename="/admin">
            <AppRoutes />
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;



