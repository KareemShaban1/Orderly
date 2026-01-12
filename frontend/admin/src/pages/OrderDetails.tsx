import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface OrderItem {
  id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  size?: string;
  selected_addons?: Array<{ id: number; name: string; price: number }>;
  special_instructions?: string;
  status: string;
}

interface Payment {
  id: number;
  payment_method: string;
  amount: number;
  status: string;
  paid_at: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  discount: number;
  tax_amount: number;
  service_charge: number;
  total: number;
  special_instructions?: string;
  created_at: string;
  confirmed_at?: string;
  preparing_at?: string;
  ready_at?: string;
  delivered_at?: string;
  table?: {
    id: number;
    table_number: string;
  };
  branch?: {
    id: number;
    name: string;
    address?: string;
  };
  tenant?: {
    id: number;
    name: string;
  };
  items?: OrderItem[];
  payments?: Payment[];
}

function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data as Order;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await apiClient.put(`/orders/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'confirmed':
        return 'badge-info';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'badge-success';
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'failed':
        return 'badge-danger';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-slate-900"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="card p-4">
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Failed to load order details</p>
              <button onClick={() => navigate('/orders')} className="btn btn-secondary">
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/orders')}
              className="text-slate-600 hover:text-slate-900 mb-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Orders
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Order #{order.order_number}</h1>
            <p className="text-slate-600 text-sm mt-1">
              Created: {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`badge ${getStatusColor(order.status)} text-sm px-4 py-2`}>
              {order.status}
            </span>
            <span className={`badge ${getPaymentStatusColor(order.payment_status)} text-sm px-4 py-2`}>
              {order.payment_status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="card p-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Order Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Branch</p>
                  <p className="font-medium text-slate-900">{order.branch?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Table</p>
                  <p className="font-medium text-slate-900">
                    {order.table?.table_number ? `Table ${order.table.table_number}` : 'Walk-in'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Order Type</p>
                  <p className="font-medium text-slate-900">
                    {order.table ? 'Dine-in' : 'Walk-in'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Order Number</p>
                  <p className="font-medium text-slate-900">#{order.order_number}</p>
                </div>
              </div>
              {order.special_instructions && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Special Instructions</p>
                  <p className="text-slate-900">{order.special_instructions}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="card p-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="border-b border-slate-200 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900">{item.item_name}</p>
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              x{item.quantity}
                            </span>
                          </div>
                          {item.size && (
                            <p className="text-sm text-slate-600">Size: <span className="font-medium">{item.size}</span></p>
                          )}
                          {item.selected_addons && item.selected_addons.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-slate-500 mb-1">Add-ons:</p>
                              <div className="flex flex-wrap gap-1">
                                {item.selected_addons.map((addon) => (
                                  <span key={addon.id} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                    {addon.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.special_instructions && (
                            <p className="text-xs text-slate-500 mt-1 italic">
                              Note: {item.special_instructions}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-lg text-slate-900">
                            {(parseFloat(item.total_price as any) || 0).toFixed(2)} EGP
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-slate-500">
                              {(parseFloat(item.unit_price as any) || 0).toFixed(2)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-4">No items found</p>
                )}
              </div>
            </div>

            {/* Payment Information */}
            {order.payments && order.payments.length > 0 && (
              <div className="card p-4">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Payment History</h2>
                <div className="space-y-3">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-slate-900 capitalize">{payment.payment_method}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(payment.paid_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {(parseFloat(payment.amount as any) || 0).toFixed(2)} EGP
                        </p>
                        <span className={`badge ${getPaymentStatusColor(payment.status)} text-xs`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="card p-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{(parseFloat(order.subtotal as any) || 0).toFixed(2)} EGP</span>
                </div>
                {parseFloat(order.discount as any) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span className="font-medium">-{(parseFloat(order.discount as any) || 0).toFixed(2)} EGP</span>
                  </div>
                )}
                {parseFloat(order.tax_amount as any) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax</span>
                    <span className="font-medium">{(parseFloat(order.tax_amount as any) || 0).toFixed(2)} EGP</span>
                  </div>
                )}
                {parseFloat(order.service_charge as any) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Service Charge</span>
                    <span className="font-medium">{(parseFloat(order.service_charge as any) || 0).toFixed(2)} EGP</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-bold text-xl text-slate-900">
                    {(parseFloat(order.total as any) || 0).toFixed(2)} EGP
                  </span>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="card p-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Status Timeline</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-2"></div>
                  <div>
                    <p className="font-medium text-slate-900">Order Created</p>
                    <p className="text-sm text-slate-600">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {order.confirmed_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">Confirmed</p>
                      <p className="text-sm text-slate-600">{new Date(order.confirmed_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {order.preparing_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">Preparing</p>
                      <p className="text-sm text-slate-600">{new Date(order.preparing_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {order.ready_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">Ready</p>
                      <p className="text-sm text-slate-600">{new Date(order.ready_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {order.delivered_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">Delivered</p>
                      <p className="text-sm text-slate-600">{new Date(order.delivered_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {(user?.role === 'tenant_admin' || user?.role === 'manager' || user?.role === 'super_admin') && (
              <div className="card p-4">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Actions</h2>
                <div className="space-y-2">
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ status: 'preparing' })}
                      disabled={updateStatusMutation.isPending}
                      className="btn btn-primary w-full"
                    >
                      {updateStatusMutation.isPending ? 'Updating...' : 'Mark as Preparing'}
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ status: 'ready' })}
                      disabled={updateStatusMutation.isPending}
                      className="btn btn-success w-full"
                    >
                      {updateStatusMutation.isPending ? 'Updating...' : 'Mark as Ready'}
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ status: 'delivered' })}
                      disabled={updateStatusMutation.isPending}
                      className="btn btn-success w-full"
                    >
                      {updateStatusMutation.isPending ? 'Updating...' : 'Mark as Delivered'}
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ status: 'cancelled' })}
                      disabled={updateStatusMutation.isPending}
                      className="btn btn-danger w-full"
                    >
                      {updateStatusMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;








