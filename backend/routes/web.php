<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OrganizationController;

Route::get('/', function () {
    return view('welcome');
});

// Organization landing pages - Changed to /restaurant/ to avoid conflict with frontend
Route::get('/restaurant/{slug}', [OrganizationController::class, 'show']);
