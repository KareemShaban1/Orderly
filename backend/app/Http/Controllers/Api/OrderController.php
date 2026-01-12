<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Table;
use App\Models\MenuItem;
use App\Models\RestaurantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'table_id' => 'required|exists:tables,id',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.size' => 'nullable|string',
            'items.*.selected_addons' => 'nullable|array',
            'items.*.special_instructions' => 'nullable|string',
            'special_instructions' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $table = Table::with(['branch.tenant'])->findOrFail($request->table_id);
            $tenant = $table->branch->tenant;
            $settings = $tenant->settings ?? RestaurantSetting::firstOrCreate(['tenant_id' => $tenant->id]);

            // Generate order number
            $orderNumber = 'ORD-' . strtoupper(Str::random(8));

            // Calculate totals
            $subtotal = 0;
            $orderItems = [];

            foreach ($request->items as $itemData) {
                $menuItem = MenuItem::findOrFail($itemData['menu_item_id']);
                
                // Calculate item price
                $unitPrice = $menuItem->price;
                if ($menuItem->has_sizes && isset($itemData['size'])) {
                    $size = collect($menuItem->sizes)->firstWhere('name', $itemData['size']);
                    if ($size) {
                        $unitPrice = $size['price'];
                    }
                }

                // Calculate addons price
                $addonsPrice = 0;
                $selectedAddons = [];
                if (isset($itemData['selected_addons']) && is_array($itemData['selected_addons'])) {
                    foreach ($itemData['selected_addons'] as $addonId) {
                        $addon = $menuItem->addons()->find($addonId);
                        if ($addon) {
                            $addonsPrice += $addon->price;
                            $selectedAddons[] = [
                                'id' => $addon->id,
                                'name' => $addon->name,
                                'name_ar' => $addon->name_ar,
                                'price' => $addon->price,
                            ];
                        }
                    }
                }

                $itemTotal = ($unitPrice + $addonsPrice) * $itemData['quantity'];
                $subtotal += $itemTotal;

                $orderItems[] = [
                    'menu_item_id' => $menuItem->id,
                    'item_name' => $menuItem->name,
                    'item_name_ar' => $menuItem->name_ar,
                    'size' => $itemData['size'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $unitPrice,
                    'addons_price' => $addonsPrice,
                    'total_price' => $itemTotal,
                    'selected_addons' => $selectedAddons,
                    'special_instructions' => $itemData['special_instructions'] ?? null,
                ];
            }

            // Calculate tax and service charge
            $taxAmount = ($subtotal * $settings->tax_rate) / 100;
            $serviceCharge = ($subtotal * $settings->service_charge_rate) / 100;
            $total = $subtotal + $taxAmount + $serviceCharge;

            // Create order
            $order = Order::create([
                'tenant_id' => $tenant->id,
                'branch_id' => $table->branch_id,
                'table_id' => $table->id,
                'order_number' => $orderNumber,
                'status' => 'pending',
                'payment_status' => 'pending',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'service_charge' => $serviceCharge,
                'total' => $total,
                'special_instructions' => $request->special_instructions,
            ]);

            // Create order items
            foreach ($orderItems as $itemData) {
                OrderItem::create(array_merge($itemData, ['order_id' => $order->id]));
            }

            // Update table status
            $table->update(['status' => 'occupied']);

            DB::commit();

            // Broadcast order created event
            event(new \App\Events\OrderCreated($order));

            return response()->json([
                'message' => 'Order placed successfully',
                'order' => $order->load(['items', 'table', 'branch']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create order: ' . $e->getMessage()], 500);
        }
    }

    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Order::with(['items', 'table', 'branch', 'tenant']);
        
        // Filter by tenant if user has tenant_id
        if ($user->tenant_id) {
            $query->where('tenant_id', $user->tenant_id);
        }
        
        // Filter by branch if user has branch_id
        if ($user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }
        
        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by payment_status if provided
        if ($request->has('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $orders = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        return response()->json($orders);
    }

    public function show($id)
    {
        $user = request()->user();
        
        $order = Order::with(['items', 'table', 'branch', 'tenant', 'payments'])->findOrFail($id);
        
        // Check if user has access to this order
        if ($user->tenant_id && $order->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($user->branch_id && $order->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        return response()->json($order);
    }

    public function update(Request $request, $id)
    {
        $user = request()->user();
        
        $order = Order::findOrFail($id);
        
        // Check if user has access to this order
        if ($user->tenant_id && $order->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($user->branch_id && $order->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $request->validate([
            'status' => 'sometimes|in:pending,confirmed,preparing,ready,delivered,cancelled',
            'payment_status' => 'sometimes|in:pending,partial,paid,refunded',
            'special_instructions' => 'nullable|string',
        ]);
        
        $order->fill($request->only(['status', 'payment_status', 'special_instructions']));
        
        // Update timestamps based on status
        if ($request->has('status')) {
            switch ($request->status) {
                case 'confirmed':
                    $order->confirmed_at = now();
                    break;
                case 'preparing':
                    $order->preparing_at = now();
                    break;
                case 'ready':
                    $order->ready_at = now();
                    break;
                case 'delivered':
                    $order->delivered_at = now();
                    break;
            }
        }
        
        $order->save();
        
        // Broadcast order status update
        event(new \App\Events\OrderStatusUpdated($order));
        
        return response()->json($order->load(['items', 'table', 'branch']));
    }

    public function destroy($id)
    {
        $user = request()->user();
        
        $order = Order::findOrFail($id);
        
        // Check if user has access to this order
        if ($user->tenant_id && $order->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Only allow deletion of pending or cancelled orders
        if (!in_array($order->status, ['pending', 'cancelled'])) {
            return response()->json(['message' => 'Cannot delete order with status: ' . $order->status], 400);
        }
        
        // Update table status back to available
        if ($order->table) {
            $order->table->update(['status' => 'available']);
        }
        
        $order->delete();
        
        return response()->json(['message' => 'Order deleted successfully']);
    }

    public function getStatus($orderId)
    {
        $order = Order::with(['items', 'table'])->findOrFail($orderId);
        
        return response()->json([
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'total' => $order->total,
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'item_name' => $item->item_name,
                        'quantity' => $item->quantity,
                        'status' => $item->status,
                    ];
                }),
            ],
        ]);
    }
}
