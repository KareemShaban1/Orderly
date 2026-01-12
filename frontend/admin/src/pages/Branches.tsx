import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Branch {
  id: number;
  name: string;
  address: string;
  governorate?: string;
  city?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  opening_time: string;
  closing_time: string;
  operating_days: string[];
  is_active: boolean;
  tables_count?: number;
  tables?: Array<{
    id: number;
    table_number: string;
    capacity: number;
    qr_code: string;
    status: string;
  }>;
}

interface Table {
  id: number;
  table_number: string;
  capacity: number;
  qr_code: string;
  qr_code_image?: string;
  qr_code_image_url?: string;
  status: string;
  is_active: boolean;
}

function Branches() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showTablesModal, setShowTablesModal] = useState(false);
  const [showGenerateTablesModal, setShowGenerateTablesModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [generateTablesData, setGenerateTablesData] = useState({
    count: 10,
    startNumber: 1,
    capacity: 4,
  });
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    governorate: '',
    city: '',
    area: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    opening_time: '09:00',
    closing_time: '23:00',
    operating_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  });

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/branches');
      return response.data;
    },
  });

  const { data: tables, isLoading: tablesLoading, refetch: refetchTables } = useQuery({
    queryKey: ['tables', selectedBranch?.id],
    queryFn: async () => {
      if (!selectedBranch) return [];
      const response = await apiClient.get('/admin/tables', {
        params: { branch_id: selectedBranch.id },
      });
      return response.data || [];
    },
    enabled: !!selectedBranch && showTablesModal,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/admin/branches', {
        ...data,
        tenant_id: user?.tenant_id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.put(`/admin/branches/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowModal(false);
      setEditingBranch(null);
      resetForm();
    },
  });

  const generateTablesMutation = useMutation({
    mutationFn: async ({ branchId, count, startNumber, capacity }: any) => {
      const response = await apiClient.post(`/admin/branches/${branchId}/tables/generate`, {
        count,
        start_number: startNumber,
        capacity,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      if (selectedBranch) {
        refetchTables();
      }
      setShowGenerateTablesModal(false);
      setGenerateTablesData({ count: 10, startNumber: 1, capacity: 4 });
      alert(data.message || 'Tables generated successfully!');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      governorate: '',
      city: '',
      area: '',
      latitude: '',
      longitude: '',
      phone: '',
      email: '',
      opening_time: '09:00',
      closing_time: '23:00',
      operating_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    });
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      governorate: branch.governorate || '',
      city: branch.city || '',
      area: branch.area || '',
      latitude: branch.latitude?.toString() || '',
      longitude: branch.longitude?.toString() || '',
      phone: branch.phone || '',
      email: branch.email || '',
      opening_time: branch.opening_time || '09:00',
      closing_time: branch.closing_time || '23:00',
      operating_days: branch.operating_days || [],
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    };
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleGenerateTables = (branch: Branch) => {
    setSelectedBranch(branch);
    setGenerateTablesData({ count: 10, startNumber: 1, capacity: 4 });
    setShowGenerateTablesModal(true);
  };

  const handleGenerateTablesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBranch) {
      generateTablesMutation.mutate({
        branchId: selectedBranch.id,
        count: generateTablesData.count,
        startNumber: generateTablesData.startNumber,
        capacity: generateTablesData.capacity,
      });
    }
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Branches</h1>
            <p className="text-slate-600 text-sm">Manage your restaurant branches and tables</p>
          </div>
          <button
            className="btn btn-primary flex items-center space-x-2"
            onClick={() => {
              setEditingBranch(null);
              resetForm();
              setShowModal(true);
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Branch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches?.map((branch: Branch) => (
            <div key={branch.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{branch.name}</h3>
                  <div className="space-y-1.5 text-sm text-slate-600">
                    {branch.address && (
                      <p className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {branch.governorate && branch.city && branch.area 
                          ? `${branch.area}, ${branch.city}, ${branch.governorate}`
                          : branch.address}
                      </p>
                    )}
                    {branch.phone && (
                      <p className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {branch.phone}
                      </p>
                    )}
                    <p className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {branch.opening_time} - {branch.closing_time}
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-center">
                  <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {branch.tables_count || branch.tables?.length || 0}
                  </div>
                  <span className="text-xs text-slate-500 mt-1">Tables</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(branch)}
                    className="btn btn-secondary text-xs flex-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBranch(branch);
                      setShowTablesModal(true);
                    }}
                    className="btn btn-primary text-xs flex-1"
                  >
                    Tables
                  </button>
                  <button
                    onClick={() => handleGenerateTables(branch)}
                    className="btn btn-success text-xs flex-1"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Branch Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                {editingBranch ? 'Edit Branch' : 'Add Branch'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Governorate</label>
                    <input
                      type="text"
                      value={formData.governorate}
                      onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                      className="input"
                      placeholder="e.g., Cairo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input"
                      placeholder="e.g., Nasr City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Area</label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="input"
                      placeholder="e.g., Abbas El Akkad"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="input"
                      placeholder="30.0444"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="input"
                      placeholder="31.2357"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Opening Time</label>
                    <input
                      type="time"
                      value={formData.opening_time}
                      onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Closing Time</label>
                    <input
                      type="time"
                      value={formData.closing_time}
                      onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingBranch ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tables Modal */}
        {showTablesModal && selectedBranch && (
          <TablesModal
            branch={selectedBranch}
            tables={tables || []}
            isLoading={tablesLoading}
            onClose={() => {
              setShowTablesModal(false);
              setSelectedBranch(null);
            }}
            onRefresh={refetchTables}
            queryClient={queryClient}
          />
        )}

        {/* Generate Tables Modal */}
        {showGenerateTablesModal && selectedBranch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Generate Tables - {selectedBranch.name}
              </h2>
              <form onSubmit={handleGenerateTablesSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    How many tables to generate?
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={generateTablesData.count}
                    onChange={(e) => setGenerateTablesData({ ...generateTablesData, count: parseInt(e.target.value) || 1 })}
                    className="input"
                    required
                    placeholder="10"
                  />
                  <p className="text-xs text-slate-500 mt-1">Maximum 100 tables at once</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Starting table number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={generateTablesData.startNumber}
                    onChange={(e) => setGenerateTablesData({ ...generateTablesData, startNumber: parseInt(e.target.value) || 1 })}
                    className="input"
                    required
                    placeholder="1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Tables will be numbered starting from this number</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Table capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={generateTablesData.capacity}
                    onChange={(e) => setGenerateTablesData({ ...generateTablesData, capacity: parseInt(e.target.value) || 4 })}
                    className="input"
                    required
                    placeholder="4"
                  />
                  <p className="text-xs text-slate-500 mt-1">Number of seats per table</p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGenerateTablesModal(false);
                      setSelectedBranch(null);
                    }}
                    className="btn btn-secondary flex-1"
                    disabled={generateTablesMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary flex-1"
                    disabled={generateTablesMutation.isPending}
                  >
                    {generateTablesMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      'Generate Tables'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TablesModalProps {
  branch: Branch;
  tables: Table[];
  isLoading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  queryClient: any;
}

function TablesModal({ branch, tables, isLoading, onClose, onRefresh, queryClient }: TablesModalProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: 4,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/tables/${id}`);
    },
    onSuccess: () => {
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const regenerateQrMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/admin/tables/${id}/regenerate-qr`);
    },
    onSuccess: () => {
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      alert('QR code regenerated successfully!');
    },
  });

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/tables', {
        ...formData,
        branch_id: branch.id,
      });
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowAddModal(false);
      setFormData({ table_number: '', capacity: 4 });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create table');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900">Tables - {branch.name}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 border-b border-slate-200">
          <button
            className="btn btn-primary flex items-center space-x-2"
            onClick={() => setShowAddModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Table</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-900"></div>
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <p className="text-sm">No tables found</p>
              <p className="text-xs text-slate-400 mt-1">Generate tables or add manually</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <div key={table.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white font-semibold">
                      {table.table_number}
                    </div>
                    <span className={`badge ${
                      table.status === 'available' ? 'badge-success' :
                      table.status === 'occupied' ? 'badge-warning' :
                      table.status === 'reserved' ? 'badge-info' :
                      'badge-danger'
                    }`}>
                      {table.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600">
                      <span className="font-medium">Capacity:</span> {table.capacity}
                    </p>
                    <p className="text-slate-500 font-mono text-xs break-all">
                      {table.qr_code}
                    </p>
                  </div>
                  
                  {/* QR Code Image Display */}
                  {table.qr_code_image_url && (
                    <div className="mt-3 p-2 bg-slate-50 rounded-lg flex flex-col items-center">
                      <img 
                        src={table.qr_code_image_url} 
                        alt={`QR Code for Table ${table.table_number}`}
                        className="w-32 h-32 object-contain"
                        onError={(e) => {
                          console.error('Failed to load QR code image:', table.qr_code_image_url);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('QR code image loaded successfully:', table.qr_code_image_url);
                        }}
                      />
                      <p className="text-xs text-slate-500 mt-1">Table {table.table_number}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-4">
                    {table.qr_code_image_url && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await apiClient.get(`/admin/tables/${table.id}/download-qr`, {
                              responseType: 'blob',
                            });
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `table-${table.table_number}-qr-code.png`);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Download failed:', error);
                            alert('Failed to download QR code');
                          }
                        }}
                        className="btn btn-success text-xs flex-1"
                        title="Download QR Code"
                      >
                        <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => regenerateQrMutation.mutate(table.id)}
                      className="btn btn-secondary text-xs flex-1"
                      title="Regenerate QR Code"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(table.id)}
                      className="btn btn-danger text-xs flex-1"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Table</h3>
              <form onSubmit={handleAddTable} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Table Number</label>
                  <input
                    type="text"
                    value={formData.table_number}
                    onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="input"
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Branches;
