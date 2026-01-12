<?php

namespace App\Http\Controllers\Api\Kitchen;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KitchenController extends Controller
{
    public function getOrders(Request $request)
    {
        $user = $request->user();
        
        $query = Order::with(['items.menuItem', 'table', 'branch'])
            ->whereIn('status', ['pending', 'confirmed', 'preparing'])
            ->orderBy('created_at', 'asc');

        // Filter by tenant if user has tenant_id
        if ($user->tenant_id) {
            $query->where('tenant_id', $user->tenant_id);
        }

        // Filter by branch if user has branch_id
        if ($user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        // Filter by preparation type
        if ($request->preparation_type) {
            $query->whereHas('items.menuItem', function ($q) use ($request) {
                $q->where('preparation_type', $request->preparation_type)
                  ->orWhere('preparation_type', 'both');
            });
        }

        $orders = $query->get();

        return response()->json([
            'orders' => $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'table_number' => $order->table->table_number,
                    'status' => $order->status,
                    'created_at' => $order->created_at,
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'item_name' => $item->item_name,
                            'quantity' => $item->quantity,
                            'status' => $item->status,
                            'special_instructions' => $item->special_instructions,
                            'preparation_type' => $item->menuItem->preparation_type ?? 'kitchen',
                        ];
                    }),
                ];
            }),
        ]);
    }

    public function updateOrderStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:confirmed,preparing,ready,delivered',
        ]);

        $order = Order::findOrFail($id);
        $user = $request->user();

        // Check permissions
        if ($user->tenant_id && $order->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $status = $request->status;
        $order->status = $status;

        // Update timestamps based on status
        switch ($status) {
            case 'confirmed':
                $order->confirmed_at = now();
                break;
            case 'preparing':
                $order->preparing_at = now();
                $order->prepared_by = $user->id;
                break;
            case 'ready':
                $order->ready_at = now();
                break;
            case 'delivered':
                $order->delivered_at = now();
                break;
        }

        $order->save();

        // Broadcast order update event (for real-time updates)
        event(new \App\Events\OrderStatusUpdated($order));

        return response()->json([
            'message' => 'Order status updated successfully',
            'order' => $order->load(['items', 'table']),
        ]);
    }

    public function updateOrderItemStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,preparing,ready,delivered',
        ]);

        $orderItem = OrderItem::with('order')->findOrFail($id);
        $user = $request->user();

        // Check permissions
        if ($user->tenant_id && $orderItem->order->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $orderItem->status = $request->status;
        $orderItem->save();

        // Update parent order status if all items are ready
        $order = $orderItem->order;
        $allItemsReady = $order->items()->where('status', '!=', 'ready')->count() === 0;
        
        if ($allItemsReady && $order->status !== 'ready') {
            $order->status = 'ready';
            $order->ready_at = now();
            $order->save();
        }

        return response()->json([
            'message' => 'Order item status updated successfully',
            'order_item' => $orderItem,
        ]);
    }
}
