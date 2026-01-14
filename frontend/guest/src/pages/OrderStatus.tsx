import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/client';
import './OrderStatus.css';

interface OrderItem {
  id: number;
  item_name: string;
  quantity: number;
  status: string;
}

interface OrderData {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  items: OrderItem[];
}

function OrderStatus() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderStatus();
      const interval = setInterval(() => {
        fetchOrderStatus();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchOrderStatus = async () => {
    try {
      const response = await apiClient.get(`/orders/${orderId}/status`);
      setOrder(response.data.order);
    } catch (err: any) {
      console.error('Error fetching order status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f39c12';
      case 'confirmed':
        return '#3498db';
      case 'preparing':
        return '#9b59b6';
      case 'ready':
        return '#27ae60';
      case 'delivered':
        return '#2ecc71';
      default:
        return '#95a5a6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'confirmed':
        return '✅';
      case 'preparing':
        return '👨‍🍳';
      case 'ready':
        return '🎉';
      case 'delivered':
        return '✓';
      default:
        return '📦';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4 sm:p-5">
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 sm:mt-5 text-slate-700 text-sm sm:text-base">Loading order status...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 sm:p-5">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl sm:shadow-2xl text-center">
          <div className="text-5xl sm:text-6xl mb-4 sm:mb-5">❌</div>
          <h2 className="text-slate-900 mb-2 sm:mb-3 text-lg sm:text-xl font-semibold">Order Not Found</h2>
          <p className="text-slate-600 text-sm sm:text-base">The order you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-5 md:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-xl sm:shadow-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <div className={`text-5xl sm:text-6xl mb-3 sm:mb-4 ${order.status === 'preparing' ? 'animate-pulse' : ''}`}>
            {getStatusIcon(order.status)}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-3">
            Order Status
          </h1>
          <div className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 bg-slate-100 rounded-full text-xs sm:text-sm text-slate-700 font-semibold mb-1 sm:mb-2">
            Order #{order.order_number}
          </div>
        </div>
        
        <div 
          className="text-center mb-6 sm:mb-8 p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2"
          style={{
            background: `linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}25 100%)`,
            borderColor: `${statusColor}40`
          }}
        >
          <div 
            className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 flex items-center justify-center gap-2"
            style={{ color: statusColor }}
          >
            <span>{getStatusIcon(order.status)}</span>
            <span>{getStatusText(order.status)}</span>
          </div>
          {order.status === 'preparing' && (
            <p className="text-slate-600 text-xs sm:text-sm mt-1 sm:mt-2">
              Your order is being prepared in the kitchen
            </p>
          )}
          {order.status === 'ready' && (
            <p className="text-slate-600 text-xs sm:text-sm mt-1 sm:mt-2">
              Your order is ready! Please wait for service
            </p>
          )}
        </div>

        <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-slate-50 rounded-xl sm:rounded-2xl">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
            <span>📋</span>
            <span>Order Items</span>
          </h2>
          <div className="flex flex-col gap-2 sm:gap-3">
            {order.items.map(item => {
              const itemStatusColor = getStatusColor(item.status);
              return (
                <div 
                  key={item.id} 
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 p-2.5 sm:p-3 bg-white rounded-lg sm:rounded-xl border border-slate-200"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 mb-0.5 sm:mb-1 text-sm sm:text-base">
                      {item.item_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      Quantity: {item.quantity}
                    </div>
                  </div>
                  <div
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                    style={{
                      background: `${itemStatusColor}15`,
                      color: itemStatusColor
                    }}
                  >
                    <span>{getStatusIcon(item.status)}</span>
                    <span>{getStatusText(item.status)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-50 rounded-xl sm:rounded-2xl mb-5 sm:mb-6 border-2 border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <span className="text-base sm:text-lg font-semibold text-slate-900">
              Total Amount:
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 flex items-center gap-1">
              <span className="text-sm sm:text-base">EGP</span>
              {Number(order.total || 0).toFixed(2)}
            </span>
          </div>
          <div className={`mt-2 sm:mt-3 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 ${
            order.payment_status === 'paid' 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            <span>{order.payment_status === 'paid' ? '✅' : '💳'}</span>
            <span>Payment: {order.payment_status === 'paid' ? 'Paid' : 'Pending'}</span>
          </div>
        </div>

        {order.payment_status !== 'paid' && (
          <button
            onClick={() => window.location.href = `/payment/${order.id}`}
            className="w-full py-3 sm:py-4 rounded-xl bg-slate-900 text-white font-bold text-sm sm:text-base shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>💳</span>
            <span>Request Bill / Pay Now</span>
          </button>
        )}

        <div className="mt-5 sm:mt-6 p-3 sm:p-4 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-600 text-center leading-relaxed">
          <p className="m-0">
            💡 <strong>Tip:</strong> This page updates automatically every 5 seconds. 
            You'll see real-time updates as your order progresses.
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderStatus;

