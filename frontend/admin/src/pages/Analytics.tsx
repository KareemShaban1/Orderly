import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

function Analytics() {
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/dashboard');
      return response.data;
    },
  });

  const { data: popularItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['analytics', 'popular-items'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/popular-items');
      return response.data;
    },
  });

  const { data: peakHours, isLoading: hoursLoading } = useQuery({
    queryKey: ['analytics', 'peak-hours'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/peak-hours');
      return response.data;
    },
  });

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-slate-900"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Today',
      orders: dashboard?.today?.orders || 0,
      revenue: dashboard?.today?.revenue || 0,
      color: 'bg-blue-500',
    },
    {
      title: 'This Week',
      orders: dashboard?.week?.orders || 0,
      revenue: dashboard?.week?.revenue || 0,
      color: 'bg-emerald-500',
    },
    {
      title: 'This Month',
      orders: dashboard?.month?.orders || 0,
      revenue: dashboard?.month?.revenue || 0,
      color: 'bg-amber-500',
    },
  ];

  const maxPeakHour = peakHours?.[0]?.order_count || 1;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Analytics & Reports</h1>
          <p className="text-slate-600 text-sm">Insights into your restaurant performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stat.orders}</p>
              <p className="text-sm text-slate-500">EGP {(parseFloat(stat.revenue as any) || 0).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Popular Items</h2>
            {itemsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-900"></div>
              </div>
            ) : popularItems?.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No data available</p>
            ) : (
              <div className="space-y-3">
                {popularItems?.slice(0, 10).map((item: any, index: number) => (
                  <div key={item.id || index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.total_quantity} orders</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">EGP {(parseFloat(item.total_revenue as any) || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Peak Hours</h2>
            {hoursLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-900"></div>
              </div>
            ) : peakHours?.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No data available</p>
            ) : (
              <div className="space-y-3">
                {peakHours?.map((hour: any) => (
                  <div key={hour.hour} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">{hour.hour}:00</span>
                      <span className="text-slate-600">{hour.order_count} orders</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-slate-900 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(hour.order_count / maxPeakHour) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
