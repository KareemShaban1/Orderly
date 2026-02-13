<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\Admin\TenantController;
use App\Http\Controllers\Api\Admin\BranchController;
use App\Http\Controllers\Api\Admin\MenuCategoryController;
use App\Http\Controllers\Api\Admin\MenuItemController;
use App\Http\Controllers\Api\Admin\ItemAddonController;
use App\Http\Controllers\Api\Kitchen\KitchenController;
use App\Http\Controllers\Api\Admin\SettingsController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\SuperAdmin\OrganizationController;
use App\Http\Controllers\Api\SuperAdmin\LocationController;
use App\Http\Controllers\Api\SuperAdmin\GameController;
use App\Http\Controllers\Api\Admin\PosController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::get('/organizations', [PublicController::class, 'getOrganizations']);
Route::get('/organizations/{slug}', [PublicController::class, 'getOrganizationBySlug']);
Route::get('/organizations/{slug}/menu', [PublicController::class, 'getOrganizationMenu']);
Route::get('/governorates', [PublicController::class, 'getGovernorates']);
Route::get('/cities', [PublicController::class, 'getCities']);
Route::get('/areas', [PublicController::class, 'getAreas']);

// Public routes
Route::get('/table/{qrCode}', [TableController::class, 'getByQrCode']);
Route::get('/menu/{tableId}', [MenuController::class, 'getMenu']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{orderId}/status', [OrderController::class, 'getStatus']);

// Authentication
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/register-organization', [AuthController::class, 'registerOrganization'])->name('auth.register-organization');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    // Admin routes
    Route::prefix('admin')->middleware('role:tenant_admin,super_admin,manager')->group(function () {
        // Tenants
        Route::apiResource('tenants', TenantController::class);

        // Branches
        Route::apiResource('branches', BranchController::class);
        Route::post('branches/{branch}/tables/generate', [BranchController::class, 'generateTables']);

        // Tables
        Route::apiResource('tables', \App\Http\Controllers\Api\Admin\TableController::class);
        Route::post('tables/{table}/regenerate-qr', [\App\Http\Controllers\Api\Admin\TableController::class, 'regenerateQrCode']);
        Route::get('tables/{table}/download-qr', [\App\Http\Controllers\Api\Admin\TableController::class, 'downloadQrCode']);

        // Menu Categories
        Route::apiResource('menu-categories', MenuCategoryController::class);

        // Menu Items
        Route::apiResource('menu-items', MenuItemController::class);
        Route::post('menu-items/{id}/update-with-files', [MenuItemController::class, 'updateWithFiles']);

        // Item Addons
        Route::apiResource('item-addons', ItemAddonController::class);

        // Settings
        Route::get('settings', [SettingsController::class, 'show']);
        Route::put('settings', [SettingsController::class, 'update']);

        // POS routes
        Route::prefix('pos')->group(function () {
            Route::get('/menu-items', [PosController::class, 'getMenuItems']);
            Route::get('/tables', [PosController::class, 'getTables']);
            Route::get('/branches', [PosController::class, 'getBranches']);
            Route::post('/orders', [PosController::class, 'createOrder']);
        });
    });

    // Kitchen routes
    Route::prefix('kitchen')->middleware('role:kitchen_staff,manager')->group(function () {
        Route::get('/orders', [KitchenController::class, 'getOrders']);
        Route::put('/orders/{order}/status', [KitchenController::class, 'updateOrderStatus']);
        Route::put('/order-items/{orderItem}/status', [KitchenController::class, 'updateOrderItemStatus']);
    });

    // Orders
    Route::apiResource('orders', OrderController::class)->except(['store']);

    // Payments
    Route::post('/orders/{orderId}/payment', [PaymentController::class, 'processPayment']);
    Route::get('/orders/{orderId}/payments', [PaymentController::class, 'getOrderPayments']);
    Route::get('/orders/{orderId}/bill', [PaymentController::class, 'requestBill']);

    // Analytics
    Route::prefix('analytics')->middleware('role:tenant_admin,manager,super_admin')->group(function () {
        Route::get('/dashboard', [AnalyticsController::class, 'dashboard']);
        Route::get('/popular-items', [AnalyticsController::class, 'popularItems']);
        Route::get('/peak-hours', [AnalyticsController::class, 'peakHours']);
        Route::get('/sales-report', [AnalyticsController::class, 'salesReport']);
    });

    // Super Admin routes
    Route::prefix('super-admin')->middleware('role:super_admin')->group(function () {
        // Organizations management
        Route::apiResource('organizations', OrganizationController::class);
        Route::get('organizations/{id}/statistics', [OrganizationController::class, 'statistics']);

        // Locations management
        Route::prefix('locations')->group(function () {
            Route::get('/governorates', [LocationController::class, 'getGovernorates']);
            Route::post('/governorates', [LocationController::class, 'addGovernorate']);
            Route::put('/governorates/{id}', [LocationController::class, 'updateGovernorate']);
            Route::delete('/governorates/{id}', [LocationController::class, 'deleteGovernorate']);
            Route::get('/cities', [LocationController::class, 'getCities']);
            Route::post('/cities', [LocationController::class, 'addCity']);
            Route::put('/cities/{id}', [LocationController::class, 'updateCity']);
            Route::delete('/cities/{id}', [LocationController::class, 'deleteCity']);
            Route::get('/areas', [LocationController::class, 'getAreas']);
            Route::post('/areas', [LocationController::class, 'addArea']);
            Route::put('/areas/{id}', [LocationController::class, 'updateArea']);
            Route::delete('/areas/{id}', [LocationController::class, 'deleteArea']);
            Route::get('/statistics', [LocationController::class, 'statistics']);
        });

        // Games management (assign to organizations)
        Route::prefix('games')->group(function () {
            Route::get('/', [GameController::class, 'index']);
            Route::get('/assignments', [GameController::class, 'assignments']);
            Route::get('/organizations', [GameController::class, 'organizations']);
            Route::post('/assign', [GameController::class, 'assign']);
        });
    });
});

