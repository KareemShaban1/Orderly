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
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('table_number');
            $table->integer('capacity')->default(4);
            $table->string('qr_code')->unique();
            $table->string('qr_code_image')->nullable();
            $table->enum('status', ['available', 'occupied', 'reserved', 'out_of_service'])->default('available');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['branch_id', 'table_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
