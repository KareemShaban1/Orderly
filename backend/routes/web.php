<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OrganizationController;

Route::get('/', function () {
    return view('welcome');
});

// Organization landing pages - Show Blade view for customers
Route::get('/restaurant/{slug}', [OrganizationController::class, 'show']);

// Handle typo: /resturant/ -> /restaurant/
Route::get('/resturant/{slug}', function ($slug) {
    return redirect("/restaurant/{$slug}", 301);
});

// Keep /organizations/ for backward compatibility - redirect to Blade view
Route::get('/organizations/{slug}', function ($slug) {
    return redirect("/restaurant/{$slug}", 301);
});
