import { useState } from 'react';
import './ItemCustomizationModal.css';

interface MenuItem {
  id: number;
  name: string;
  name_ar: string | null;
  price: number;
  has_sizes: boolean;
  sizes: Array<{ name: string; price: number }> | null;
  has_addons: boolean;
  addons: Array<{ id: number; name: string; name_ar: string | null; price: number }>;
}

interface ItemCustomizationModalProps {
  item: MenuItem | null;
  language: 'en' | 'ar';
  onClose: () => void;
  onAddToCart: (item: MenuItem, size: string | undefined, addons: number[], quantity: number, specialInstructions?: string) => void;
}

function ItemCustomizationModal({ item, language, onClose, onAddToCart }: ItemCustomizationModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!item) return null;

  const getItemPrice = () => {
    let basePrice = item.price;
    
    if (item.has_sizes && selectedSize && item.sizes) {
      const size = item.sizes.find(s => s.name === selectedSize);
      if (size) {
        basePrice = size.price;
      }
    }

    let addonsPrice = 0;
    if (item.has_addons && selectedAddons.length > 0) {
      selectedAddons.forEach(addonId => {
        const addon = item.addons.find(a => a.id === addonId);
        if (addon) {
          addonsPrice += addon.price;
        }
      });
    }

    return (basePrice + addonsPrice) * quantity;
  };

  const handleAddToCart = () => {
    // Validate size selection if item has sizes
    if (item.has_sizes && !selectedSize) {
      alert(language === 'ar' ? 'يرجى اختيار الحجم' : 'Please select a size');
      return;
    }
    
    onAddToCart(
      item,
      item.has_sizes && selectedSize ? selectedSize : undefined,
      selectedAddons,
      quantity,
      specialInstructions || undefined
    );
    onClose();
  };

  const toggleAddon = (addonId: number) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>{language === 'ar' && item.name_ar ? item.name_ar : item.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {item.has_sizes && item.sizes && item.sizes.length > 0 && (
            <div className="customization-section">
              <h3>{language === 'ar' ? 'اختر الحجم' : 'Select Size'}</h3>
              <div className="size-options">
                {item.sizes.map((size, index) => (
                  <button
                    key={index}
                    className={`size-option ${selectedSize === size.name ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size.name)}
                  >
                    <span>{size.name}</span>
                    <span className="size-price">EGP {size.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.has_addons && item.addons.length > 0 && (
            <div className="customization-section">
              <h3>{language === 'ar' ? 'الإضافات' : 'Add-ons'}</h3>
              <div className="addons-list">
                {item.addons.map(addon => (
                  <label key={addon.id} className="addon-item">
                    <input
                      type="checkbox"
                      checked={selectedAddons.includes(addon.id)}
                      onChange={() => toggleAddon(addon.id)}
                    />
                    <span className="addon-name">
                      {language === 'ar' && addon.name_ar ? addon.name_ar : addon.name}
                    </span>
                    {addon.price > 0 && (
                      <span className="addon-price">+EGP {addon.price.toFixed(2)}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="customization-section">
            <h3>{language === 'ar' ? 'الكمية' : 'Quantity'}</h3>
            <div className="quantity-selector">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          <div className="customization-section">
            <label>
              <h3>{language === 'ar' ? 'ملاحظات خاصة' : 'Special Instructions'}</h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder={language === 'ar' ? 'أضف أي ملاحظات خاصة...' : 'Add any special instructions...'}
                rows={3}
              />
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <div className="total-price">
            <span>{language === 'ar' ? 'المجموع' : 'Total'}:</span>
            <span className="price">EGP {getItemPrice().toFixed(2)}</span>
          </div>
          <button className="btn btn-primary" onClick={handleAddToCart}>
            {language === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemCustomizationModal;



