import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
          {/* Main entry point - QR scanning or table selection */}
          <Route path="/" element={<TableScan />} />
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

