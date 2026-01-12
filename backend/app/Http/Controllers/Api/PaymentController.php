<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function processPayment(Request $request, $orderId)
    {
        $request->validate([
            'payment_method' => 'required|in:cash,card,paymob,vodafone_cash,apple_pay,other',
            'amount' => 'required|numeric|min:0',
            'transaction_id' => 'nullable|string',
        ]);

        $order = Order::findOrFail($orderId);

        try {
            DB::beginTransaction();

            $payment = Payment::create([
                'order_id' => $order->id,
                'payment_method' => $request->payment_method,
                'amount' => $request->amount,
                'status' => 'pending',
                'transaction_id' => $request->transaction_id,
            ]);

            // Process payment based on method
            if (in_array($request->payment_method, ['paymob', 'vodafone_cash', 'apple_pay', 'card'])) {
                // Integrate with payment gateway
                // For now, we'll simulate success
                $payment->status = 'completed';
                $payment->paid_at = now();
                $payment->save();
            } else {
                // Cash payment - mark as completed immediately
                $payment->status = 'completed';
                $payment->paid_at = now();
                $payment->save();
            }

            // Update order payment status
            $totalPaid = $order->payments()->where('status', 'completed')->sum('amount');
            
            if ($totalPaid >= $order->total) {
                $order->payment_status = 'paid';
            } elseif ($totalPaid > 0) {
                $order->payment_status = 'partial';
            }

            $order->save();

            DB::commit();

            return response()->json([
                'message' => 'Payment processed successfully',
                'payment' => $payment,
                'order' => $order->fresh(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Payment failed: ' . $e->getMessage()], 500);
        }
    }

    public function getOrderPayments($orderId)
    {
        $order = Order::findOrFail($orderId);
        $payments = $order->payments;

        return response()->json([
            'order' => $order,
            'payments' => $payments,
            'total_paid' => $payments->where('status', 'completed')->sum('amount'),
            'remaining' => $order->total - $payments->where('status', 'completed')->sum('amount'),
        ]);
    }

    public function requestBill(Request $request, $orderId)
    {
        $order = Order::with(['items', 'table', 'branch'])->findOrFail($orderId);

        return response()->json([
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'table_number' => $order->table->table_number,
                'items' => $order->items->map(function ($item) {
                    return [
                        'name' => $item->item_name,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'total_price' => $item->total_price,
                    ];
                }),
                'subtotal' => $order->subtotal,
                'tax_amount' => $order->tax_amount,
                'service_charge' => $order->service_charge,
                'discount' => $order->discount,
                'total' => $order->total,
                'payments' => $order->payments->map(function ($payment) {
                    return [
                        'method' => $payment->payment_method,
                        'amount' => $payment->amount,
                        'status' => $payment->status,
                        'paid_at' => $payment->paid_at,
                    ];
                }),
            ],
        ]);
    }
}
