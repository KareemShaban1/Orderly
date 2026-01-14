import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrganizationsList from './pages/OrganizationsList';
import OrganizationPage from './pages/OrganizationPage';
import TableScan from './pages/TableScan';
import Menu from './pages/Menu';
import OrderStatus from './pages/OrderStatus';
import Payment from './pages/Payment';
import Receipt from './pages/Receipt';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
				  {/* Simple flow: Organizations List → Organization Page → Scan/Order → Menu */}
				  <Route path="/" element={<OrganizationsList />} />
				  <Route path="/organizations" element={<OrganizationsList />} />
				  <Route path="/organization/:slug" element={<OrganizationPage />} />
				  {/* QR Code scanning and table confirmation */}
          <Route path="/scan" element={<TableScan />} />
          <Route path="/order/:qrCode" element={<TableScan />} />
          {/* Customer ordering flow */}
          <Route path="/menu/:tableId" element={<Menu />} />
          <Route path="/order-status/:orderId" element={<OrderStatus />} />
          <Route path="/payment/:orderId" element={<Payment />} />
          <Route path="/receipt/:orderId" element={<Receipt />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
