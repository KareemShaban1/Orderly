<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OrganizationController;

Route::get('/', function () {
    return view('welcome');
});

// Organization landing pages
Route::get('/organizations/{slug}', [OrganizationController::class, 'show']);
