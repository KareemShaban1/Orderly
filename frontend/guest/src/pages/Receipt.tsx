import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/client';
import './Receipt.css';

interface Order {
  id: number;
  order_number: string;
  table: { table_number: string };
  items: Array<{
    id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount: number;
  total: number;
  payments: Array<{
    payment_method: string;
    amount: number;
    status: string;
    paid_at: string;
  }>;
  created_at: string;
}

function Receipt() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    if (orderId) {
      fetchReceipt();
    }
  }, [orderId]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/orders/${orderId}/bill`);
      setOrder(response.data.order);
    } catch (err: any) {
      console.error('Error fetching receipt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="loading">Loading receipt...</div>;
  }

  if (!order) {
    return <div className="container">Receipt not found</div>;
  }

  return (
    <div className="receipt-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="receipt-actions">
        <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
          {language === 'en' ? 'العربية' : 'English'}
        </button>
        <button onClick={handlePrint} className="btn-primary">
          {language === 'ar' ? 'طباعة' : 'Print'}
        </button>
      </div>

      <div className="receipt" id="receipt">
        <div className="receipt-header">
          <h1>{language === 'ar' ? 'فاتورة' : 'Receipt'}</h1>
          <div className="receipt-info">
            <p><strong>{language === 'ar' ? 'رقم الطلب' : 'Order #'}:</strong> {order.order_number}</p>
            <p><strong>{language === 'ar' ? 'طاولة' : 'Table'}:</strong> {order.table.table_number}</p>
            <p><strong>{language === 'ar' ? 'التاريخ' : 'Date'}:</strong> {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="receipt-items">
          <table>
            <thead>
              <tr>
                <th>{language === 'ar' ? 'الصنف' : 'Item'}</th>
                <th>{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th>{language === 'ar' ? 'السعر' : 'Price'}</th>
                <th>{language === 'ar' ? 'المجموع' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id}>
                  <td>{item.item_name}</td>
                  <td>{item.quantity}</td>
                  <td>EGP {item.unit_price.toFixed(2)}</td>
                  <td>EGP {item.total_price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="receipt-summary">
          <div className="summary-row">
            <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>EGP {order.subtotal.toFixed(2)}</span>
          </div>
          {order.tax_amount > 0 && (
            <div className="summary-row">
              <span>{language === 'ar' ? 'الضريبة' : 'Tax'}</span>
              <span>EGP {order.tax_amount.toFixed(2)}</span>
            </div>
          )}
          {order.service_charge > 0 && (
            <div className="summary-row">
              <span>{language === 'ar' ? 'رسوم الخدمة' : 'Service Charge'}</span>
              <span>EGP {order.service_charge.toFixed(2)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="summary-row discount">
              <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
              <span>-EGP {order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>{language === 'ar' ? 'المجموع الكلي' : 'Total'}</span>
            <span>EGP {order.total.toFixed(2)}</span>
          </div>
        </div>

        {order.payments.length > 0 && (
          <div className="receipt-payments">
            <h3>{language === 'ar' ? 'الدفعات' : 'Payments'}</h3>
            {order.payments.map((payment, index) => (
              <div key={index} className="payment-row">
                <span>{payment.payment_method}</span>
                <span>EGP {payment.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="receipt-footer">
          <p>{language === 'ar' ? 'شكراً لزيارتكم!' : 'Thank you for your visit!'}</p>
        </div>
      </div>
    </div>
  );
}

export default Receipt;



