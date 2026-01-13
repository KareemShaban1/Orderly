import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterOrganization() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    org_name: '',
    org_email: '',
    org_phone: '',
    org_address: '',
    governorate: '',
    city: '',
    area: '',
    subscription_plan: 'starter' as 'starter' | 'professional' | 'enterprise',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerOrganization } = useAuth();

  const { data: governorates } = useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      const response = await apiClient.get('/governorates');
      return response.data.data as string[];
    },
  });

  const { data: cities } = useQuery({
    queryKey: ['cities', formData.governorate],
    queryFn: async () => {
      const params: any = {};
      if (formData.governorate) params.governorate = formData.governorate;
      const response = await apiClient.get('/cities', { params });
      return response.data.data as string[];
    },
    enabled: !!formData.governorate,
  });

  const { data: areas } = useQuery({
    queryKey: ['areas', formData.city, formData.governorate],
    queryFn: async () => {
      const params: any = {};
      if (formData.governorate) params.governorate = formData.governorate;
      if (formData.city) params.city = formData.city;
      const response = await apiClient.get('/areas', { params });
      return response.data.data as string[];
    },
    enabled: !!formData.city && !!formData.governorate,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await registerOrganization({
        org_name: formData.org_name,
        org_email: formData.org_email,
        org_phone: formData.org_phone || undefined,
        org_address: formData.org_address || undefined,
        governorate: formData.governorate || undefined,
        city: formData.city || undefined,
        area: formData.area || undefined,
        subscription_plan: formData.subscription_plan,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });
      navigate('/');
      setFormData({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        org_name: '',
        org_email: '',
        org_phone: '',
        org_address: '',
        governorate: '',
        city: '',
        area: '',
        subscription_plan: 'starter',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-slate-900 hover:text-slate-700 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
          <h2 className="text-3xl font-bold text-slate-900 text-center">Register Organization</h2>
          <p className="text-slate-600 text-center mt-2">Create your organization account</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Details */}
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Organization Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name *</label>
                  <input
                    type="text"
                    value={formData.org_name}
                    onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Restaurant Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization Email *</label>
                  <input
                    type="email"
                    value={formData.org_email}
                    onChange={(e) => setFormData({ ...formData, org_email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="org@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.org_phone}
                    onChange={(e) => setFormData({ ...formData, org_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="+20 123 456 7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.org_address}
                    onChange={(e) => setFormData({ ...formData, org_address: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Street Address"
                  />
                </div>
                
                {/* Location Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Governorate *</label>
                    <select
                      value={formData.governorate}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          governorate: e.target.value,
                          city: '',
                          area: ''
                        });
                      }}
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    >
                      <option value="">Select Governorate</option>
                      {governorates?.map((gov) => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                    <select
                      value={formData.city}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          city: e.target.value,
                          area: ''
                        });
                      }}
                      required
                      disabled={!formData.governorate}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select City</option>
                      {cities?.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Area *</label>
                    <select
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      required
                      disabled={!formData.city}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Area</option>
                      {areas?.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan *</label>
                  <select
                    value={formData.subscription_plan}
                    onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value as any })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Admin Account */}
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Admin Account</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register Organization'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login-organization" className="text-slate-900 font-medium hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}





