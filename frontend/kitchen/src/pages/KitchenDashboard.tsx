import { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface OrderItem {
  id: number;
  item_name: string;
  quantity: number;
  status: string;
  special_instructions?: string;
  preparation_type: string;
}

interface Order {
  id: number;
  order_number: string;
  table_number: string;
  status: string;
  created_at: string;
  items: OrderItem[];
}

interface KitchenDashboardProps {
  echo: any;
}

function KitchenDashboard({ echo }: KitchenDashboardProps) {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'kitchen' | 'bar'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGW77+efTQ8MT6fj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBhlu+/nn00PDE+n4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    fetchOrders();

    const branchId = user?.branch_id || 1;
    const channelName = `kitchen.${branchId}`;

    echo.channel(channelName).listen('.order.created', (data: any) => {
      if (soundEnabled) {
        playNotificationSound();
      }
      setNewOrderAlert(`New Order #${data.order?.order_number || 'N/A'}`);
      setTimeout(() => setNewOrderAlert(null), 5000);
      fetchOrders();
    });

    echo.channel(channelName).listen('.order.status.updated', (data: any) => {
      fetchOrders();
    });

    // Auto-refresh every 30 seconds
    const refreshInterval = autoRefresh ? setInterval(fetchOrders, 30000) : null;

    return () => {
      echo.leave(channelName);
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [user?.branch_id, soundEnabled, autoRefresh]);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/kitchen/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await apiClient.put(`/kitchen/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const updateItemStatus = async (itemId: number, status: string) => {
    try {
      await apiClient.put(`/kitchen/order-items/${itemId}/status`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filter === 'all') return true;
      return order.items.some(
        (item) =>
          item.preparation_type === filter &&
          (item.status === 'pending' || item.status === 'preparing')
      );
    }).sort((a, b) => {
      // Sort by status priority and then by time
      const statusPriority: { [key: string]: number } = {
        'pending': 1,
        'preparing': 2,
        'ready': 3,
        'completed': 4,
      };
      const aPriority = statusPriority[a.status] || 5;
      const bPriority = statusPriority[b.status] || 5;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [orders, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'completed':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'preparing':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        );
      case 'ready':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-emerald-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <p className="text-slate-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* New Order Alert */}
      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-400/20 backdrop-blur-sm">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-lg">{newOrderAlert}</p>
              <p className="text-sm opacity-90">New order received!</p>
            </div>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="ml-4 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 mb-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Kitchen Display</h1>
                  <p className="text-sm text-slate-600">Welcome back, <span className="font-semibold text-slate-900">{user?.name}</span></p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700 font-medium">Sound</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700 font-medium">Auto-refresh</span>
              </label>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Pending</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Preparing</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{preparingCount}</p>
                </div>
                <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Ready</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{readyCount}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-6">
            {(['all', 'kitchen', 'bar'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  filter === f
                    ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg transform scale-105'
                    : 'bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Orders</h2>
            <p className="text-slate-600">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-2xl shadow-lg border-l-4 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                  order.status === 'pending'
                    ? 'border-amber-500'
                    : order.status === 'preparing'
                    ? 'border-blue-500'
                    : order.status === 'ready'
                    ? 'border-emerald-500'
                    : 'border-slate-300'
                }`}
              >
                {/* Order Header */}
                <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-bold text-slate-900">Order #{order.order_number}</h3>
                        {order.status === 'pending' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-semibold">Table {order.table_number}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{getTimeAgo(order.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
                  {order.items
                    .filter((item) =>
                      filter === 'all' ||
                      (item.preparation_type === filter &&
                        (item.status === 'pending' || item.status === 'preparing'))
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          item.status === 'pending'
                            ? 'bg-amber-50 border-amber-200'
                            : item.status === 'preparing'
                            ? 'bg-blue-50 border-blue-200'
                            : item.status === 'ready'
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-bold text-slate-900">{item.item_name}</h4>
                              <span className="px-2 py-0.5 bg-white rounded-full text-xs font-bold text-slate-700 border border-slate-300">
                                x{item.quantity}
                              </span>
                            </div>
                            {item.special_instructions && (
                              <div className="mt-2 flex items-start space-x-2 p-2 bg-amber-100 border border-amber-300 rounded-lg">
                                <svg className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <p className="text-xs font-medium text-amber-900">{item.special_instructions}</p>
                              </div>
                            )}
                          </div>
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            <span className="capitalize">{item.status}</span>
                          </span>
                        </div>

                        {/* Item Actions */}
                        <div className="flex space-x-2 mt-3">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => updateItemStatus(item.id, 'preparing')}
                              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold text-sm shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                            >
                              Start Preparing
                            </button>
                          )}
                          {item.status === 'preparing' && (
                            <button
                              onClick={() => updateItemStatus(item.id, 'ready')}
                              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-sm shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                            >
                              Mark Ready
                            </button>
                          )}
                          {item.status === 'ready' && (
                            <button
                              onClick={() => updateItemStatus(item.id, 'completed')}
                              className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold text-sm shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                            >
                              Completed
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Order Actions */}
                {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing') && (
                  <div className="p-5 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                        >
                          Confirm Order
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold text-sm shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-sm shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                        >
                          Ready for Pickup
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default KitchenDashboard;
