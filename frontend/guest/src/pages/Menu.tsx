import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import ItemCustomizationModal from '../components/ItemCustomizationModal';
import './Menu.css';

interface MenuItem {
  id: number;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  image: string | null;
  price: number;
  has_sizes: boolean;
  sizes: Array<{ name: string; price: number }> | null;
  has_addons: boolean;
  addons: Array<{ id: number; name: string; name_ar: string | null; price: number }>;
  preparation_type: string;
  estimated_preparation_time: number | null;
}

interface Category {
  id: number;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  image: string | null;
  items: MenuItem[];
}

interface MenuData {
  menu: Category[];
  tenant: {
    name: string;
    logo: string | null;
  };
}

interface CartItem {
  menu_item_id: number;
  quantity: number;
  size?: string;
  selected_addons?: number[];
  special_instructions?: string;
}

function Menu() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (tableId) {
      fetchMenu();
    }
  }, [tableId]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/menu/${tableId}`);
      setMenuData(response.data);
      if (response.data.menu.length > 0) {
        setSelectedCategory(response.data.menu[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem, size?: string, addons: number[] = [], quantity: number = 1, specialInstructions?: string) => {
    const cartItem: CartItem = {
      menu_item_id: item.id,
      quantity,
      size,
      selected_addons: addons.length > 0 ? addons : undefined,
      special_instructions: specialInstructions,
    };
    setCart([...cart, cartItem]);
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.has_sizes || item.has_addons) {
      setCustomizingItem(item);
    } else {
      addToCart(item);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    const updatedCart = [...cart];
    updatedCart[index].quantity = quantity;
    setCart(updatedCart);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    try {
      setOrderPlacing(true);
      const response = await apiClient.post('/orders', {
        table_id: parseInt(tableId!),
        items: cart,
      });

      navigate(`/order-status/${response.data.order.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setOrderPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 sm:p-5">
        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl sm:shadow-2xl text-center">
          <p className="text-slate-600 text-base sm:text-lg">Menu not found</p>
        </div>
      </div>
    );
  }

  const currentCategory = menuData.menu.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-slate-900 px-4 sm:px-5 py-4 sm:py-5 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 text-white sticky top-0 z-[100]">
        <div className="flex items-center gap-2 sm:gap-3">
          {menuData.tenant.logo && (
            <img 
              src={menuData.tenant.logo} 
              alt={menuData.tenant.name}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover shadow-lg"
            />
          )}
          <h1 className="m-0 text-lg sm:text-xl md:text-2xl font-bold text-white">
            {menuData.tenant.name}
          </h1>
        </div>
        <button 
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 border border-white/30 rounded-lg text-white font-medium text-xs sm:text-sm transition-all duration-300 backdrop-blur-sm hover:bg-white/30"
        >
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto p-3 sm:p-4 md:p-5 gap-3 sm:gap-4 md:gap-5">
        <div className="w-full lg:w-56 flex flex-row lg:flex-col gap-2 sm:gap-3 overflow-x-auto lg:overflow-x-visible lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-2 pb-2 lg:pb-0">
          {menuData.menu.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl text-left transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
                selectedCategory === category.id
                  ? 'bg-slate-900 text-white font-semibold shadow-lg translate-x-0 lg:translate-x-1'
                  : 'bg-white text-slate-800 font-medium shadow-sm hover:bg-slate-100 translate-x-0 lg:hover:translate-x-1'
              }`}
            >
              {language === 'ar' && category.name_ar ? category.name_ar : category.name}
            </button>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {currentCategory?.items.length === 0 ? (
            <div className="col-span-full text-center py-12 sm:py-16 px-4 sm:px-5 text-slate-500">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🍽️</div>
              <p className="text-base sm:text-lg font-medium">
                {language === 'ar' ? 'لا توجد عناصر في هذه الفئة' : 'No items in this category'}
              </p>
            </div>
          ) : (
            currentCategory?.items.map(item => (
              <div 
                key={item.id} 
                className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-40 sm:h-48 object-cover bg-slate-100"
                  />
                )}
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <h3 className="mb-2 text-slate-900 text-base sm:text-lg font-semibold leading-snug">
                    {language === 'ar' && item.name_ar ? item.name_ar : item.name}
                  </h3>
                  {(item.description || item.description_ar) && (
                    <p className="text-slate-600 mb-3 text-xs sm:text-sm leading-relaxed flex-1">
                      {language === 'ar' && item.description_ar ? item.description_ar : item.description}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mt-auto pt-3 sm:pt-4">
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600 flex items-center gap-1">
                      <span className="text-sm sm:text-base">EGP</span>
                      {item.price.toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleItemClick(item)}
                      className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-xs sm:text-sm shadow-md hover:bg-slate-800 hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      {language === 'ar' ? '➕ أضف' : '+ Add'}
                    </button>
                  </div>
                  {item.estimated_preparation_time && (
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                      <span>⏱️</span>
                      <span>{item.estimated_preparation_time} {language === 'ar' ? 'دقيقة' : 'min'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 right-0 w-full sm:w-full md:max-w-md bg-white shadow-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-t-3xl z-[1000]">
          <div className="flex justify-between items-center mb-4 sm:mb-5 pb-3 sm:pb-4 border-b-2 border-slate-100">
            <h2 className="m-0 text-lg sm:text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>🛒</span>
              {language === 'ar' ? 'السلة' : 'Cart'} ({cart.length})
            </h2>
            <div className="w-8 sm:w-10 h-1 bg-slate-300 rounded cursor-pointer"></div>
          </div>
          {cart.map((item, index) => {
            const menuItem = menuData.menu
              .flatMap(cat => cat.items)
              .find(i => i.id === item.menu_item_id);
            
            const itemPrice = menuItem?.price || 0;
            const sizePrice = item.size && menuItem?.has_sizes && menuItem.sizes
              ? menuItem.sizes.find(s => s.name === item.size)?.price || itemPrice
              : itemPrice;
            
            const addonsPrice = item.selected_addons?.reduce((sum, addonId) => {
              const addon = menuItem?.addons.find(a => a.id === addonId);
              return sum + (addon?.price || 0);
            }, 0) || 0;
            
            const totalItemPrice = (sizePrice + addonsPrice) * item.quantity;
            
            return (
              <div key={index} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">
                    {language === 'ar' && menuItem?.name_ar ? menuItem.name_ar : menuItem?.name}
                    {item.size && ` (${item.size})`}
                  </span>
                  {item.selected_addons && item.selected_addons.length > 0 && (
                    <span className="cart-item-addons">
                      + {item.selected_addons.length} {language === 'ar' ? 'إضافات' : 'addons'}
                    </span>
                  )}
                  <span className="cart-item-price">EGP {totalItemPrice.toFixed(2)}</span>
                </div>
                <div className="cart-item-actions">
                  <button onClick={() => updateCartItemQuantity(index, item.quantity - 1)}>-</button>
                  <span className="quantity">{item.quantity}</span>
                  <button onClick={() => updateCartItemQuantity(index, item.quantity + 1)}>+</button>
                  <button onClick={() => removeFromCart(index)} className="remove-btn">
                    {language === 'ar' ? 'حذف' : 'Remove'}
                  </button>
                </div>
              </div>
            );
          })}
          
          {cart.length > 0 && (
            <div className="cart-total">
              <strong>
                {language === 'ar' ? 'المجموع' : 'Total'}: EGP{' '}
                {cart.reduce((sum, item) => {
                  const menuItem = menuData.menu
                    .flatMap(cat => cat.items)
                    .find(i => i.id === item.menu_item_id);
                  const itemPrice = menuItem?.price || 0;
                  const sizePrice = item.size && menuItem?.has_sizes && menuItem.sizes
                    ? menuItem.sizes.find(s => s.name === item.size)?.price || itemPrice
                    : itemPrice;
                  const addonsPrice = item.selected_addons?.reduce((addonSum, addonId) => {
                    const addon = menuItem?.addons.find(a => a.id === addonId);
                    return addonSum + (addon?.price || 0);
                  }, 0) || 0;
                  return sum + (sizePrice + addonsPrice) * item.quantity;
                }, 0).toFixed(2)}
              </strong>
            </div>
          )}
          <button
            onClick={placeOrder}
            disabled={orderPlacing}
            className={`w-full py-3 sm:py-4 rounded-xl text-white font-bold text-sm sm:text-base transition-all duration-300 mt-3 sm:mt-4 ${
              orderPlacing
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-green hover:-translate-y-0.5 shadow-lg shadow-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/50'
            }`}
          >
            {orderPlacing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {language === 'ar' ? 'جاري الطلب...' : 'Placing Order...'}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>✅</span>
                {language === 'ar' ? 'تأكيد الطلب' : 'Place Order'}
              </span>
            )}
          </button>
          
          <p className="mt-2 sm:mt-3 text-xs text-slate-600 text-center leading-relaxed">
            {language === 'ar' 
              ? 'سيتم إرسال طلبك إلى المطبخ فوراً' 
              : 'Your order will be sent to the kitchen immediately'}
          </p>
        </div>
      )}

      {customizingItem && (
        <ItemCustomizationModal
          item={customizingItem}
          language={language}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
}

export default Menu;

