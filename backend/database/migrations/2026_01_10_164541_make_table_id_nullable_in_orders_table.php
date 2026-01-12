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
        Schema::table('orders', function (Blueprint $table) {
            // Drop the existing foreign key constraint
            $table->dropForeign(['table_id']);
            
            // Make table_id nullable
            $table->unsignedBigInteger('table_id')->nullable()->change();
            
            // Re-add the foreign key constraint with nullable support
            $table->foreign('table_id')->references('id')->on('tables')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop the foreign key
            $table->dropForeign(['table_id']);
            
            // Make table_id not nullable again
            $table->unsignedBigInteger('table_id')->nullable(false)->change();
            
            // Re-add the foreign key constraint
            $table->foreign('table_id')->references('id')->on('tables')->onDelete('cascade');
        });
    }
};
