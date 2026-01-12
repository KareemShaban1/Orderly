import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useState, useEffect } from 'react';

function Settings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    tax_rate: 14,
    service_charge_rate: 0,
    currency: 'EGP',
    currency_symbol: 'EGP',
    default_language: 'en',
    enable_online_payment: true,
    primary_color: '#1e293b',
    secondary_color: '#ffffff',
    welcome_message: '',
    welcome_message_ar: '',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/settings');
      return response.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        tax_rate: settings.tax_rate || 14,
        service_charge_rate: settings.service_charge_rate || 0,
        currency: settings.currency || 'EGP',
        currency_symbol: settings.currency_symbol || 'EGP',
        default_language: settings.default_language || 'en',
        enable_online_payment: settings.enable_online_payment ?? true,
        primary_color: settings.primary_color || '#1e293b',
        secondary_color: settings.secondary_color || '#ffffff',
        welcome_message: settings.welcome_message || '',
        welcome_message_ar: settings.welcome_message_ar || '',
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.put('/admin/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaving(false);
      alert('Settings saved successfully!');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
          <p className="text-slate-600 text-sm">Manage your restaurant settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Financial Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Charge Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.service_charge_rate}
                  onChange={(e) => setFormData({ ...formData, service_charge_rate: parseFloat(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency Symbol</label>
                <input
                  type="text"
                  value={formData.currency_symbol}
                  onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Appearance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Color</label>
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Secondary Color</label>
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Localization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Language</label>
                <select
                  value={formData.default_language}
                  onChange={(e) => setFormData({ ...formData, default_language: e.target.value })}
                  className="input"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Welcome Message (English)</label>
                <textarea
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  rows={3}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Welcome Message (Arabic)</label>
                <textarea
                  value={formData.welcome_message_ar}
                  onChange={(e) => setFormData({ ...formData, welcome_message_ar: e.target.value })}
                  rows={3}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment</h2>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enable_online_payment}
                onChange={(e) => setFormData({ ...formData, enable_online_payment: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">Enable Online Payment</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
