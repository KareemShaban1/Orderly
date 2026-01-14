<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OrganizationController;

Route::get('/', function () {
    return view('welcome');
});

// Organization landing pages - Redirect to frontend React app
Route::get('/restaurant/{slug}', function ($slug) {
    $frontendUrl = config('app.frontend_url', env('APP_URL', 'http://localhost'));
    return redirect("{$frontendUrl}/organizations/{$slug}", 301);
});

// Also handle typo: /resturant/ -> /restaurant/
Route::get('/resturant/{slug}', function ($slug) {
    $frontendUrl = config('app.frontend_url', env('APP_URL', 'http://localhost'));
    return redirect("{$frontendUrl}/organizations/{$slug}", 301);
});
