<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('restaurant_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->decimal('tax_rate', 5, 2)->default(14); // VAT in Egypt
            $table->decimal('service_charge_rate', 5, 2)->default(0);
            $table->string('currency', 3)->default('EGP');
            $table->string('currency_symbol')->default('EGP');
            $table->string('default_language')->default('en');
            $table->json('supported_languages')->default('["en", "ar"]');
            $table->boolean('enable_online_payment')->default(true);
            $table->json('payment_gateways')->nullable(); // Configuration for payment gateways
            $table->string('primary_color')->default('#000000');
            $table->string('secondary_color')->default('#ffffff');
            $table->string('logo')->nullable();
            $table->text('welcome_message')->nullable();
            $table->text('welcome_message_ar')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurant_settings');
    }
};
