<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\Branch;
use App\Models\Table;
use App\Models\User;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\ItemAddon;
use App\Models\RestaurantSetting;
use App\Services\QrCodeService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TenantSeeder extends Seeder
{
    protected $qrCodeService;

    public function __construct()
    {
        $this->qrCodeService = app(QrCodeService::class);
    }

    public function run(): void
    {
        // Create a demo tenant
        $tenant = Tenant::create([
            'name' => 'Cairo Restaurant',
            'slug' => 'cairo-restaurant-' . str()->random(6),
            'email' => 'info@cairorestaurant.com',
            'phone' => '+20 123 456 7890',
            'address' => '123 Tahrir Square, Cairo, Egypt',
            'subscription_plan' => 'professional',
            'subscription_start_date' => now(),
            'subscription_end_date' => now()->addYear(),
            'is_active' => true,
            'is_trial' => false,
        ]);

        // Create settings
        RestaurantSetting::create([
            'tenant_id' => $tenant->id,
            'tax_rate' => 14,
            'service_charge_rate' => 10,
            'currency' => 'EGP',
            'currency_symbol' => 'EGP',
            'default_language' => 'en',
            'supported_languages' => ['en', 'ar'],
            'enable_online_payment' => true,
            'primary_color' => '#3498db',
            'secondary_color' => '#ffffff',
        ]);

        // Create admin user
        $admin = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Admin User',
            'email' => 'admin@cairorestaurant.com',
            'password' => Hash::make('password'),
            'role' => 'tenant_admin',
            'is_active' => true,
        ]);

        // Create branch
        $branch = Branch::create([
            'tenant_id' => $tenant->id,
            'name' => 'Main Branch',
            'address' => '123 Tahrir Square, Cairo, Egypt',
            'phone' => '+20 123 456 7890',
            'email' => 'main@cairorestaurant.com',
            'opening_time' => '09:00',
            'closing_time' => '23:00',
            'operating_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            'is_active' => true,
        ]);

        // Create tables (only if they don't already exist)
        for ($i = 1; $i <= 10; $i++) {
            // Check if table already exists for this branch
            $existingTable = Table::where('branch_id', $branch->id)
                ->where('table_number', (string)$i)
                ->first();

            if (!$existingTable) {
                $qrCode = $this->qrCodeService->generateUniqueCode();
                $table = Table::create([
                    'branch_id' => $branch->id,
                    'table_number' => (string)$i,
                    'capacity' => 4,
                    'qr_code' => $qrCode,
                    'status' => 'available',
                    'is_active' => true,
                ]);

                // Generate QR code image (will be done when service is properly configured)
                // $this->qrCodeService->generateForTable($table);
            }
        }

        // Create menu categories
        $appetizers = MenuCategory::create([
            'tenant_id' => $tenant->id,
            'name' => 'Appetizers',
            'name_ar' => 'المقبلات',
            'description' => 'Start your meal with our delicious appetizers',
            'description_ar' => 'ابدأ وجبتك مع مقبلاتنا اللذيذة',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $mainCourses = MenuCategory::create([
            'tenant_id' => $tenant->id,
            'name' => 'Main Courses',
            'name_ar' => 'الأطباق الرئيسية',
            'description' => 'Our signature main dishes',
            'description_ar' => 'أطباقنا الرئيسية المميزة',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $beverages = MenuCategory::create([
            'tenant_id' => $tenant->id,
            'name' => 'Beverages',
            'name_ar' => 'المشروبات',
            'description' => 'Refreshing drinks',
            'description_ar' => 'مشروبات منعشة',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        // Create addons
        $extraCheese = ItemAddon::create([
            'tenant_id' => $tenant->id,
            'name' => 'Extra Cheese',
            'name_ar' => 'جبنة إضافية',
            'price' => 10.00,
            'is_active' => true,
        ]);

        $extraSauce = ItemAddon::create([
            'tenant_id' => $tenant->id,
            'name' => 'Extra Sauce',
            'name_ar' => 'صلصة إضافية',
            'price' => 5.00,
            'is_active' => true,
        ]);

        // Create menu items
        $hummus = MenuItem::create([
            'tenant_id' => $tenant->id,
            'category_id' => $appetizers->id,
            'name' => 'Hummus',
            'name_ar' => 'حمص',
            'description' => 'Creamy chickpea dip with tahini',
            'description_ar' => 'غمسة الحمص الكريمية مع الطحينة',
            'price' => 25.00,
            'has_sizes' => false,
            'has_addons' => true,
            'is_available' => true,
            'sort_order' => 1,
            'preparation_type' => 'kitchen',
            'estimated_preparation_time' => 10,
        ]);
        $hummus->addons()->attach([$extraSauce->id]);

        $grilledChicken = MenuItem::create([
            'tenant_id' => $tenant->id,
            'category_id' => $mainCourses->id,
            'name' => 'Grilled Chicken',
            'name_ar' => 'دجاج مشوي',
            'description' => 'Tender grilled chicken with herbs',
            'description_ar' => 'دجاج مشوي طري مع الأعشاب',
            'price' => 85.00,
            'has_sizes' => true,
            'sizes' => [
                ['name' => 'Small', 'price' => 85.00],
                ['name' => 'Large', 'price' => 120.00],
            ],
            'has_addons' => true,
            'is_available' => true,
            'sort_order' => 1,
            'preparation_type' => 'kitchen',
            'estimated_preparation_time' => 20,
        ]);
        $grilledChicken->addons()->attach([$extraCheese->id, $extraSauce->id]);

        $cola = MenuItem::create([
            'tenant_id' => $tenant->id,
            'category_id' => $beverages->id,
            'name' => 'Cola',
            'name_ar' => 'كولا',
            'description' => 'Refreshing cola drink',
            'description_ar' => 'مشروب كولا منعش',
            'price' => 15.00,
            'has_sizes' => true,
            'sizes' => [
                ['name' => 'Small', 'price' => 15.00],
                ['name' => 'Medium', 'price' => 20.00],
                ['name' => 'Large', 'price' => 25.00],
            ],
            'has_addons' => false,
            'is_available' => true,
            'sort_order' => 1,
            'preparation_type' => 'bar',
            'estimated_preparation_time' => 2,
        ]);

        // Create kitchen staff
        User::create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'name' => 'Kitchen Staff',
            'email' => 'kitchen@cairorestaurant.com',
            'password' => Hash::make('password'),
            'role' => 'kitchen_staff',
            'is_active' => true,
        ]);
    }
}
