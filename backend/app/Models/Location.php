<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    protected $fillable = [
        'type',
        'name',
        'parent_id',
        'governorate_name',
        'city_name',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Location::class, 'parent_id');
    }

    public function governorate(): ?Location
    {
        if ($this->type === 'governorate') {
            return $this;
        }
        if ($this->type === 'city' && $this->parent) {
            return $this->parent;
        }
        if ($this->type === 'area' && $this->parent) {
            return $this->parent->parent;
        }
        return null;
    }

    public function city(): ?Location
    {
        if ($this->type === 'city') {
            return $this;
        }
        if ($this->type === 'area' && $this->parent) {
            return $this->parent;
        }
        return null;
    }
}
