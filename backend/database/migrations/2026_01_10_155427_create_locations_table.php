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
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['governorate', 'city', 'area']);
            $table->string('name');
            $table->unsignedBigInteger('parent_id')->nullable(); // For city (parent = governorate) and area (parent = city)
            $table->string('governorate_name')->nullable(); // Store governorate name for quick access
            $table->string('city_name')->nullable(); // Store city name for quick access (for areas)
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['type', 'parent_id']);
            $table->index('governorate_name');
            $table->index('city_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
