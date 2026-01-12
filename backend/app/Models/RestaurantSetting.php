<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantSetting extends Model
{
    protected $fillable = [
        'tenant_id',
        'tax_rate',
        'service_charge_rate',
        'currency',
        'currency_symbol',
        'default_language',
        'supported_languages',
        'enable_online_payment',
        'payment_gateways',
        'primary_color',
        'secondary_color',
        'logo',
        'welcome_message',
        'welcome_message_ar',
    ];

    protected function casts(): array
    {
        return [
            'tax_rate' => 'decimal:2',
            'service_charge_rate' => 'decimal:2',
            'supported_languages' => 'array',
            'enable_online_payment' => 'boolean',
            'payment_gateways' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
