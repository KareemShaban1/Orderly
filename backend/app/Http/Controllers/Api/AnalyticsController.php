<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;
        $branchId = $user->branch_id;

        $query = Order::query();
        
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }
        
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        // Today's stats
        $todayOrders = (clone $query)->whereDate('created_at', today())->count();
        $todayRevenue = (clone $query)->whereDate('created_at', today())->sum('total');
        
        // This week
        $weekOrders = (clone $query)->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])->count();
        $weekRevenue = (clone $query)->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])->sum('total');
        
        // This month
        $monthOrders = (clone $query)->whereMonth('created_at', now()->month)->count();
        $monthRevenue = (clone $query)->whereMonth('created_at', now()->month)->sum('total');

        return response()->json([
            'today' => [
                'orders' => $todayOrders,
                'revenue' => $todayRevenue,
            ],
            'week' => [
                'orders' => $weekOrders,
                'revenue' => $weekRevenue,
            ],
            'month' => [
                'orders' => $monthOrders,
                'revenue' => $monthRevenue,
            ],
        ]);
    }

    public function popularItems(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;
        $branchId = $user->branch_id;

        $query = OrderItem::query()
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->select('menu_items.name', 'menu_items.name_ar', DB::raw('SUM(order_items.quantity) as total_quantity'), DB::raw('SUM(order_items.total_price) as total_revenue'))
            ->groupBy('menu_items.id', 'menu_items.name', 'menu_items.name_ar')
            ->orderBy('total_quantity', 'desc')
            ->limit(10);

        if ($tenantId) {
            $query->where('orders.tenant_id', $tenantId);
        }
        
        if ($branchId) {
            $query->where('orders.branch_id', $branchId);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('orders.created_at', [$request->start_date, $request->end_date]);
        } else {
            $query->whereMonth('orders.created_at', now()->month);
        }

        $items = $query->get();

        return response()->json($items);
    }

    public function peakHours(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;
        $branchId = $user->branch_id;

        $query = Order::query()
            ->select(DB::raw('HOUR(created_at) as hour'), DB::raw('COUNT(*) as order_count'))
            ->groupBy('hour')
            ->orderBy('hour');

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }
        
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        } else {
            $query->whereMonth('created_at', now()->month);
        }

        $hours = $query->get();

        return response()->json($hours);
    }

    public function salesReport(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;
        $branchId = $user->branch_id;

        $startDate = $request->start_date ?? Carbon::now()->startOfMonth();
        $endDate = $request->end_date ?? Carbon::now()->endOfMonth();

        $query = Order::query()
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }
        
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $orders = $query->get();

        $dailySales = $orders->groupBy(function ($order) {
            return $order->created_at->format('Y-m-d');
        })->map(function ($dayOrders) {
            return [
                'date' => $dayOrders->first()->created_at->format('Y-m-d'),
                'orders' => $dayOrders->count(),
                'revenue' => $dayOrders->sum('total'),
            ];
        })->values();

        return response()->json([
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
            'total_orders' => $orders->count(),
            'total_revenue' => $orders->sum('total'),
            'daily_sales' => $dailySales,
        ]);
    }
}
