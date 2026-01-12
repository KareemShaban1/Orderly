import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';

interface Category {
  id: number;
  name: string;
  name_ar: string;
  description: string;
  is_active: boolean;
  items_count?: number;
}

interface MenuItem {
  id: number;
  name: string;
  name_ar: string;
  price: number;
  is_available: boolean;
  category_id: number;
  main_image_url?: string;
  main_image_thumb_url?: string;
  gallery_images?: Array<{ id: number; url: string; thumb_url: string }>;
}

function MenuManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from URL
  const getActiveTab = (): 'categories' | 'items' => {
    if (location.pathname === '/menu/items') return 'items';
    return 'categories';
  };
  
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>(getActiveTab());
  
  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/menu-categories', {
        params: { tenant_id: user?.tenant_id },
      });
      return response.data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/menu-items', {
        params: { tenant_id: user?.tenant_id },
      });
      return response.data;
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/admin/menu-categories', {
        ...data,
        tenant_id: user?.tenant_id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      setShowCategoryModal(false);
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      // Add all form fields
      Object.keys(data).forEach(key => {
        if (key === 'sizes') {
          // Send sizes as JSON string if it exists and is not null
          if (data[key] !== null && data[key] !== undefined && Array.isArray(data[key]) && data[key].length > 0) {
            formData.append('sizes', JSON.stringify(data[key]));
          }
        } else if (key === 'addon_ids' && Array.isArray(data[key])) {
          data[key].forEach((id: number) => {
            formData.append('addon_ids[]', id.toString());
          });
        } else if (key === 'has_sizes' || key === 'has_addons' || key === 'is_available') {
          // Convert booleans to "1" or "0" for Laravel validation
          formData.append(key, data[key] ? '1' : '0');
        } else if (key !== 'main_image' && key !== 'gallery' && data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      
      formData.append('tenant_id', user?.tenant_id?.toString() || '');
      
      // Add images - always append if they exist (even if null, we check for File object)
      if (data.main_image instanceof File) {
        formData.append('main_image', data.main_image);
      }
      if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
        data.gallery.forEach((file: File) => {
          if (file instanceof File) {
            formData.append('gallery[]', file);
          }
        });
      }
      
      // Don't set Content-Type header - let axios/browser set it automatically for FormData
      const response = await apiClient.post('/admin/menu-items', formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      setShowItemModal(false);
      setEditingItem(null);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const formData = new FormData();
      
      // Add all form fields
      Object.keys(data).forEach(key => {
        if (key === 'sizes') {
          // Send sizes as JSON string if it exists and is not null
          if (data[key] !== null && data[key] !== undefined && Array.isArray(data[key]) && data[key].length > 0) {
            formData.append('sizes', JSON.stringify(data[key]));
          }
        } else if (key === 'addon_ids' && Array.isArray(data[key])) {
          data[key].forEach((id: number) => {
            formData.append('addon_ids[]', id.toString());
          });
        } else if (key === 'remove_gallery_ids' && Array.isArray(data[key])) {
          data[key].forEach((mediaId: number) => {
            formData.append('remove_gallery_ids[]', mediaId.toString());
          });
        } else if (key === 'has_sizes' || key === 'has_addons' || key === 'is_available') {
          // Convert booleans to "1" or "0" for Laravel validation
          formData.append(key, data[key] ? '1' : '0');
        } else if (key !== 'main_image' && key !== 'gallery' && data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      
      // Add images - always append if they exist (even if null, we check for File object)
      if (data.main_image instanceof File) {
        formData.append('main_image', data.main_image, data.main_image.name);
        console.log('✅ Main image added to FormData:', data.main_image.name, data.main_image.size, 'bytes');
      } else {
        console.log('❌ Main image is NOT a File:', typeof data.main_image, data.main_image);
      }
      if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
        data.gallery.forEach((file: File) => {
          if (file instanceof File) {
            formData.append('gallery[]', file, file.name);
            console.log('✅ Gallery image added to FormData:', file.name, file.size, 'bytes');
          }
        });
      }
      
      // Log all FormData entries for debugging
      console.log('📦 FormData contents:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      // Use POST to custom endpoint for file uploads (better compatibility than PUT with FormData)
      const response = await apiClient.post(`/admin/menu-items/${id}/update-with-files`, formData);
      console.log('✅ Update response:', response.data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      setShowItemModal(false);
      setEditingItem(null);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.put(`/admin/menu-categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      setShowCategoryModal(false);
      setEditingCategory(null);
    },
  });

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Menu Management</h1>
          <p className="text-slate-600 text-sm">Manage your menu categories and items</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <div className="flex space-x-1">
            <button
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'categories'
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => {
                setActiveTab('categories');
                navigate('/menu/categories');
              }}
            >
              Categories
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'items'
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => {
                setActiveTab('items');
                navigate('/menu/items');
              }}
            >
              Menu Items
            </button>
          </div>
        </div>

        {activeTab === 'categories' && (
          <div>
            <div className="mb-4">
              <button className="btn btn-primary" onClick={() => setShowCategoryModal(true)}>
                Add Category
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories?.map((category: Category) => (
                <div key={category.id} className="card p-5">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{category.name}</h3>
                  {category.name_ar && (
                    <p className="text-sm text-slate-600 mb-2" dir="rtl">{category.name_ar}</p>
                  )}
                  {category.description && (
                    <p className="text-sm text-slate-500 mb-3">{category.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <span className="text-xs text-slate-500">{category.items_count || 0} items</span>
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowCategoryModal(true);
                      }}
                      className="btn btn-secondary text-xs"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            <div className="mb-4">
              <button className="btn btn-primary" onClick={() => setShowItemModal(true)}>
                Add Menu Item
              </button>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Arabic Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {items?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          No menu items found
                        </td>
                      </tr>
                    ) : (
                      items?.map((item: MenuItem) => {
                        const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
                        const category = categories?.find((cat: Category) => cat.id === item.category_id);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.main_image_thumb_url || item.main_image_url ? (
                                <img
                                  src={item.main_image_thumb_url || item.main_image_url}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-slate-900">{item.name}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-slate-600" dir="rtl">{item.name_ar}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-slate-600">{category?.name || '-'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-slate-900">EGP {Number(price || 0).toFixed(2)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`badge ${item.is_available ? 'badge-success' : 'badge-danger'}`}>
                                {item.is_available ? 'Available' : 'Unavailable'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setShowItemModal(true);
                                }}
                                className="btn btn-secondary text-xs"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showCategoryModal && (
          <CategoryModal
            category={editingCategory}
            onClose={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
            }}
            onSave={(data: any) => {
              if (editingCategory) {
                updateCategoryMutation.mutate({ id: editingCategory.id, data });
              } else {
                createCategoryMutation.mutate(data);
              }
            }}
          />
        )}

        {showItemModal && (
          <ItemModal
            item={editingItem}
            categories={categories || []}
            onClose={() => {
              setShowItemModal(false);
              setEditingItem(null);
            }}
            onSave={(data: any) => {
              if (editingItem) {
                updateItemMutation.mutate({ id: editingItem.id, data });
              } else {
                createItemMutation.mutate(data);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function CategoryModal({ category, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    name_ar: category?.name_ar || '',
    description: category?.description || '',
    is_active: category?.is_active ?? true,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">{category ? 'Edit Category' : 'Add Category'}</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name (English)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name (Arabic)</label>
            <input
              type="text"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemModal({ item, categories, onClose, onSave }: any) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: item?.name || '',
    name_ar: item?.name_ar || '',
    description: item?.description || '',
    price: typeof item?.price === 'string' ? parseFloat(item.price) : (item?.price || 0),
    category_id: item?.category_id || categories[0]?.id || '',
    is_available: item?.is_available ?? true,
    has_sizes: item?.has_sizes || false,
    sizes: item?.sizes || [],
    has_addons: item?.has_addons || false,
    addon_ids: item?.addons?.map((a: any) => a.id) || [],
  });

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(item?.main_image_url || null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<Array<{ id?: number; url: string; isNew?: boolean }>>(
    item?.gallery_images?.map((img: any) => ({ id: img.id, url: img.url })) || []
  );
  const [galleryToRemove, setGalleryToRemove] = useState<number[]>([]);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [newSize, setNewSize] = useState({ name: '', price: '' });

  // Update image previews when item changes (e.g., after editing)
  useEffect(() => {
    if (item) {
      setMainImagePreview(item.main_image_url || null);
      setMainImage(null); // Clear any new file selection
      setGalleryPreviews(item.gallery_images?.map((img: any) => ({ id: img.id, url: img.url })) || []);
      setGalleryImages([]); // Clear any new gallery files
      setGalleryToRemove([]); // Clear removal list
      // Reset file inputs
      if (mainImageInputRef.current) {
        mainImageInputRef.current.value = '';
      }
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    } else {
      // Reset when creating new item
      setMainImagePreview(null);
      setMainImage(null);
      setGalleryPreviews([]);
      setGalleryImages([]);
      setGalleryToRemove([]);
      // Reset file inputs
      if (mainImageInputRef.current) {
        mainImageInputRef.current.value = '';
      }
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  }, [item]);

  const { data: addons } = useQuery({
    queryKey: ['item-addons'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/item-addons', {
        params: { tenant_id: user?.tenant_id },
      });
      return response.data;
    },
  });

  const createAddonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/admin/item-addons', {
        ...data,
        tenant_id: user?.tenant_id,
      });
      return response.data;
    },
    onSuccess: (newAddon) => {
      queryClient.invalidateQueries({ queryKey: ['item-addons'] });
      setFormData({
        ...formData,
        addon_ids: [...formData.addon_ids, newAddon.id],
      });
    },
  });

  const [showAddAddon, setShowAddAddon] = useState(false);
  const [newAddon, setNewAddon] = useState({ name: '', name_ar: '', price: '' });

  const handleAddSize = () => {
    if (newSize.name && newSize.price) {
      setFormData({
        ...formData,
        sizes: [...formData.sizes, { name: newSize.name, price: parseFloat(newSize.price) }],
        has_sizes: true,
      });
      setNewSize({ name: '', price: '' });
    }
  };

  const handleRemoveSize = (index: number) => {
    const newSizes = formData.sizes.filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      sizes: newSizes,
      has_sizes: newSizes.length > 0,
    });
  };

  const handleCreateAddon = () => {
    if (newAddon.name && newAddon.price) {
      createAddonMutation.mutate({
        name: newAddon.name,
        name_ar: newAddon.name_ar || '',
        price: parseFloat(newAddon.price),
      });
      setNewAddon({ name: '', name_ar: '', price: '' });
      setShowAddAddon(false);
    }
  };

  const handleToggleAddon = (addonId: number) => {
    setFormData({
      ...formData,
      addon_ids: formData.addon_ids.includes(addonId)
        ? formData.addon_ids.filter((id: number) => id !== addonId)
        : [...formData.addon_ids, addonId],
      has_addons: true,
    });
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // If no file selected, clear the new image but keep the preview if editing
      setMainImage(null);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryImages([...galleryImages, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prev => [...prev, { url: reader.result as string, isNew: true }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    const preview = galleryPreviews[index];
    if (preview.id) {
      // Mark for removal from server
      setGalleryToRemove([...galleryToRemove, preview.id]);
    }
    // Remove from previews
    setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
    // Remove from new files if it's a new image
    if (preview.isNew) {
      const newIndex = galleryPreviews.slice(0, index).filter(p => p.isNew).length;
      setGalleryImages(galleryImages.filter((_, i) => i !== newIndex));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Submitting form data:');
    console.log('  mainImage:', mainImage, mainImage instanceof File ? `[File: ${mainImage.name}, ${mainImage.size} bytes]` : 'null/undefined');
    console.log('  galleryImages:', galleryImages.length, 'files');
    console.log('  formData:', formData);
    
    const submitData = {
      ...formData,
      sizes: formData.has_sizes ? formData.sizes : null,
      addon_ids: formData.has_addons ? formData.addon_ids : [],
      main_image: mainImage,
      gallery: galleryImages,
      remove_gallery_ids: galleryToRemove,
    };
    console.log('📤 Final submitData:', {
      ...submitData,
      main_image: submitData.main_image instanceof File ? `[File: ${submitData.main_image.name}]` : submitData.main_image,
      gallery: submitData.gallery?.map((f: File) => f instanceof File ? `[File: ${f.name}]` : f),
    });
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">{item ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                className="input"
                required
              >
                {categories.map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Base Price (EGP)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, price: value === '' ? 0 : parseFloat(value) || 0 });
                }}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name (English)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name (Arabic)</label>
            <input
              type="text"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="input"
            />
          </div>

          {/* Main Image Section */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Main Image</label>
            <div className="space-y-3">
              {mainImagePreview && (
                <div className="relative inline-block">
                  <img
                    src={mainImagePreview}
                    alt="Main preview"
                    className="w-32 h-32 object-cover rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMainImage(null);
                      setMainImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleMainImageChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
              />
            </div>
          </div>

          {/* Gallery Images Section */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Images</label>
            <div className="space-y-3">
              {galleryPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {galleryPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview.url}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
              />
            </div>
          </div>

          {/* Sizes Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_sizes}
                  onChange={(e) => setFormData({ ...formData, has_sizes: e.target.checked, sizes: e.target.checked ? formData.sizes : [] })}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <span className="text-sm font-medium text-slate-700">Has Sizes</span>
              </label>
            </div>
            {formData.has_sizes && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {formData.sizes.map((size: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg">
                      <span className="flex-1 text-sm font-medium text-slate-900">{size.name}</span>
                      <span className="text-sm text-slate-600">EGP {Number(size.price || 0).toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Size name (e.g., Small)"
                    value={newSize.name}
                    onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                    className="input flex-1"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    value={newSize.price}
                    onChange={(e) => setNewSize({ ...newSize, price: e.target.value })}
                    className="input w-32"
                  />
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="btn btn-secondary"
                  >
                    Add Size
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Addons Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_addons}
                  onChange={(e) => setFormData({ ...formData, has_addons: e.target.checked, addon_ids: e.target.checked ? formData.addon_ids : [] })}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <span className="text-sm font-medium text-slate-700">Has Add-ons</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddAddon(!showAddAddon)}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                + New Addon
              </button>
            </div>
            {showAddAddon && (
              <div className="mb-3 p-3 bg-slate-50 rounded-lg space-y-2">
                <input
                  type="text"
                  placeholder="Addon name (English)"
                  value={newAddon.name}
                  onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Addon name (Arabic)"
                  value={newAddon.name_ar}
                  onChange={(e) => setNewAddon({ ...newAddon, name_ar: e.target.value })}
                  className="input"
                />
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    value={newAddon.price}
                    onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleCreateAddon}
                    className="btn btn-primary"
                    disabled={createAddonMutation.isPending}
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAddon(false);
                      setNewAddon({ name: '', name_ar: '', price: '' });
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {formData.has_addons && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {addons?.map((addon: any) => (
                  <label key={addon.id} className="flex items-center space-x-3 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={formData.addon_ids.includes(addon.id)}
                      onChange={() => handleToggleAddon(addon.id)}
                      className="w-4 h-4 rounded text-slate-900"
                    />
                    <span className="flex-1 text-sm text-slate-900">{addon.name}</span>
                    <span className="text-sm text-slate-600">EGP {Number(addon.price || 0).toFixed(2)}</span>
                  </label>
                ))}
                {addons?.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">No addons available. Create one above.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">Available</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MenuManagement;
