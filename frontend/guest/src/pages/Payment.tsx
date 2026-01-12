import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import './Payment.css';

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
    id: number;
    payment_method: string;
    amount: number;
    status: string;
  }>;
}

function Payment() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    if (orderId) {
      fetchBill();
    }
  }, [orderId]);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/orders/${orderId}/bill`);
      setOrder(response.data.order);
      setPaymentAmount(response.data.order.total);
    } catch (err: any) {
      console.error('Error fetching bill:', err);
      alert(err.response?.data?.message || 'Failed to load bill');
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = order?.payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0) || 0;
  
  const remaining = (order?.total || 0) - totalPaid;

  const handlePayment = async () => {
    if (paymentAmount <= 0) {
      alert(language === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    if (paymentAmount > remaining) {
      alert(language === 'ar' ? 'المبلغ أكبر من المتبقي' : 'Amount exceeds remaining balance');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.post(`/orders/${orderId}/payment`, {
        payment_method: paymentMethod,
        amount: paymentAmount,
      });
      
      alert(language === 'ar' ? 'تم الدفع بنجاح' : 'Payment processed successfully');
      fetchBill();
      
      if (remaining - paymentAmount <= 0) {
        setTimeout(() => {
          navigate(`/order-status/${orderId}`);
        }, 1000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="container">Order not found</div>;
  }

  return (
    <div className="payment-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="payment-header">
        <h1>{language === 'ar' ? 'الفاتورة والدفع' : 'Bill & Payment'}</h1>
        <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <div className="bill-section">
        <div className="bill-header">
          <h2>{language === 'ar' ? 'الفاتورة' : 'Bill'}</h2>
          <div className="order-info">
            <span>{language === 'ar' ? 'طلب رقم' : 'Order #'}: {order.order_number}</span>
            <span>{language === 'ar' ? 'طاولة' : 'Table'}: {order.table.table_number}</span>
          </div>
        </div>

        <div className="bill-items">
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

        <div className="bill-summary">
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
          {totalPaid > 0 && (
            <>
              <div className="summary-row">
                <span>{language === 'ar' ? 'المدفوع' : 'Paid'}</span>
                <span>EGP {totalPaid.toFixed(2)}</span>
              </div>
              <div className="summary-row remaining">
                <span>{language === 'ar' ? 'المتبقي' : 'Remaining'}</span>
                <span>EGP {remaining.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {order.payments.length > 0 && (
          <div className="payment-history">
            <h3>{language === 'ar' ? 'سجل الدفعات' : 'Payment History'}</h3>
            {order.payments.map(payment => (
              <div key={payment.id} className="payment-item">
                <span>{payment.payment_method}</span>
                <span>EGP {payment.amount.toFixed(2)}</span>
                <span className={`status ${payment.status}`}>{payment.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {remaining > 0 && (
        <div className="payment-section">
          <h2>{language === 'ar' ? 'الدفع' : 'Payment'}</h2>
          
          <div className="payment-methods">
            <label className={`payment-method ${paymentMethod === 'cash' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>{language === 'ar' ? 'نقدي' : 'Cash'}</span>
            </label>
            <label className={`payment-method ${paymentMethod === 'card' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>{language === 'ar' ? 'بطاقة' : 'Card'}</span>
            </label>
            <label className={`payment-method ${paymentMethod === 'paymob' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="paymob"
                checked={paymentMethod === 'paymob'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>Paymob</span>
            </label>
            <label className={`payment-method ${paymentMethod === 'vodafone_cash' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="vodafone_cash"
                checked={paymentMethod === 'vodafone_cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>{language === 'ar' ? 'فودافون كاش' : 'Vodafone Cash'}</span>
            </label>
          </div>

          <div className="payment-amount">
            <label>
              {language === 'ar' ? 'المبلغ' : 'Amount'} (EGP)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={remaining}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
            />
            <button
              className="btn-full"
              onClick={() => setPaymentAmount(remaining)}
            >
              {language === 'ar' ? 'المبلغ الكامل' : 'Full Amount'}
            </button>
          </div>

          <button
            className="btn btn-primary btn-large"
            onClick={handlePayment}
            disabled={processing || paymentAmount <= 0}
          >
            {processing
              ? (language === 'ar' ? 'جاري المعالجة...' : 'Processing...')
              : (language === 'ar' ? 'دفع' : 'Pay')
            }
          </button>
        </div>
      )}

      {remaining <= 0 && (
        <div className="payment-complete">
          <h2>{language === 'ar' ? 'تم الدفع بالكامل' : 'Payment Complete'}</h2>
          <div className="complete-actions">
            <button
              className="btn btn-success"
              onClick={() => navigate(`/receipt/${orderId}`)}
            >
              {language === 'ar' ? 'عرض الإيصال' : 'View Receipt'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/order-status/${orderId}`)}
            >
              {language === 'ar' ? 'عرض حالة الطلب' : 'View Order Status'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payment;

