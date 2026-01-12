<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Table;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RestaurantSetting;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PosController extends Controller
{
    /**
     * Get menu items for POS
     */
    public function getMenuItems(Request $request)
    {
        $user = $request->user();
        $branchId = $request->get('branch_id');
        
        // Get tenant from user or branch
        $tenantId = $user->tenant_id;
        if ($branchId) {
            $branch = Branch::find($branchId);
            if ($branch) {
                $tenantId = $branch->tenant_id;
            }
        }

        if (!$tenantId) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $categories = MenuCategory::with(['menuItems' => function ($query) {
            $query->where('is_available', true)
                  ->with('addons')
                  ->orderBy('sort_order');
        }])
        ->where('tenant_id', $tenantId)
        ->where('is_active', true)
        ->orderBy('sort_order')
        ->get();

        $menu = $categories->map(function ($category) {
            return [
                'id' => $category->id,
                'name' => $category->name,
                'name_ar' => $category->name_ar,
                'items' => $category->menuItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'name_ar' => $item->name_ar,
                        'description' => $item->description,
                        'image' => $item->image,
                        'price' => (float) $item->price,
                        'has_sizes' => $item->has_sizes,
                        'sizes' => $item->sizes ?? [],
                        'has_addons' => $item->has_addons,
                        'addons' => $item->addons ? $item->addons->map(function ($addon) {
                            return [
                                'id' => $addon->id,
                                'name' => $addon->name,
                                'name_ar' => $addon->name_ar,
                                'price' => (float) $addon->price,
                            ];
                        })->toArray() : [],
                    ];
                })->toArray(),
            ];
        })->filter(function ($category) {
            // Filter out categories with no items
            return count($category['items']) > 0;
        })->values();

        return response()->json([
            'success' => true,
            'data' => $menu,
        ]);
    }

    /**
     * Get available tables for POS
     */
    public function getTables(Request $request)
    {
        $user = $request->user();
        $branchId = $request->get('branch_id');

        $query = Table::with('branch');

        if ($user->tenant_id) {
            $query->whereHas('branch', function ($q) use ($user) {
                $q->where('tenant_id', $user->tenant_id);
            });
        }

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $tables = $query->where('is_active', true)
            ->orderBy('table_number')
            ->get()
            ->map(function ($table) {
                return [
                    'id' => $table->id,
                    'table_number' => $table->table_number,
                    'capacity' => $table->capacity,
                    'status' => $table->status,
                    'branch_id' => $table->branch_id,
                    'branch_name' => $table->branch->name ?? '',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $tables,
        ]);
    }

    /**
     * Create order from POS
     */
    public function createOrder(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'table_id' => 'nullable|exists:tables,id',
            'customer_type' => 'required|in:walk_in,table',
            'customer_name' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.size' => 'nullable|string',
            'items.*.selected_addons' => 'nullable|array',
            'items.*.special_instructions' => 'nullable|string',
            'discount' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|in:fixed,percentage',
            'special_instructions' => 'nullable|string',
            'payment_method' => 'nullable|in:cash,card,paymob,vodafone_cash,apple_pay,other',
            'payment_status' => 'nullable|in:pending,paid',
        ]);

        try {
            DB::beginTransaction();

            $branch = Branch::with('tenant')->findOrFail($request->branch_id);
            
            // Check tenant access
            if ($user->tenant_id && $branch->tenant_id !== $user->tenant_id) {
                return response()->json(['message' => 'Unauthorized access to this branch'], 403);
            }

            $tenant = $branch->tenant;
            $settings = $tenant->settings ?? RestaurantSetting::firstOrCreate(['tenant_id' => $tenant->id]);

            // Handle table selection
            $tableId = null;
            if ($request->customer_type === 'table') {
                if (!$request->table_id) {
                    return response()->json(['message' => 'Table is required for table orders'], 422);
                }
                $table = Table::findOrFail($request->table_id);
                if ($table->branch_id !== $branch->id) {
                    return response()->json(['message' => 'Table does not belong to selected branch'], 422);
                }
                $tableId = $table->id;
            }

            // Generate order number
            $orderNumber = 'POS-' . strtoupper(Str::random(8));

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

            // Calculate discount
            $discount = 0;
            if ($request->has('discount') && $request->discount > 0) {
                if ($request->discount_type === 'percentage') {
                    $discount = ($subtotal * $request->discount) / 100;
                } else {
                    $discount = $request->discount;
                }
            }

            // Calculate tax and service charge on subtotal after discount
            $taxableAmount = $subtotal - $discount;
            $taxAmount = ($taxableAmount * $settings->tax_rate) / 100;
            $serviceCharge = ($taxableAmount * $settings->service_charge_rate) / 100;
            $total = $taxableAmount + $taxAmount + $serviceCharge;

            // Determine payment status
            $paymentStatus = $request->payment_status ?? 'pending';
            if ($request->payment_method && $request->payment_status === 'paid') {
                $paymentStatus = 'paid';
            }

            // Create order
            $order = Order::create([
                'tenant_id' => $tenant->id,
                'branch_id' => $branch->id,
                'table_id' => $tableId,
                'order_number' => $orderNumber,
                'status' => 'confirmed', // POS orders are immediately confirmed
                'payment_status' => $paymentStatus,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax_amount' => $taxAmount,
                'service_charge' => $serviceCharge,
                'total' => $total,
                'special_instructions' => $request->special_instructions,
                'confirmed_at' => now(),
            ]);

            // Create order items
            foreach ($orderItems as $itemData) {
                OrderItem::create(array_merge($itemData, ['order_id' => $order->id]));
            }

            // Update table status if table order
            if ($tableId) {
                $table = Table::find($tableId);
                if ($table) {
                    $table->update(['status' => 'occupied']);
                }
            }

            // Create payment if paid
            if ($paymentStatus === 'paid' && $request->payment_method) {
                Payment::create([
                    'order_id' => $order->id,
                    'amount' => $total,
                    'payment_method' => $request->payment_method,
                    'status' => 'completed',
                    'transaction_id' => 'POS-' . strtoupper(Str::random(12)),
                    'paid_at' => now(),
                ]);
            }

            DB::commit();

            // Broadcast order created event
            event(new \App\Events\OrderCreated($order));

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => $order->load(['items', 'table', 'branch', 'payments']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get branches for POS
     */
    public function getBranches(Request $request)
    {
        $user = $request->user();

        $query = Branch::with('tenant');

        if (!$user->isSuperAdmin() && $user->tenant_id) {
            $query->where('tenant_id', $user->tenant_id);
        }

        $branches = $query->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'address' => $branch->address,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $branches,
        ]);
    }
}
