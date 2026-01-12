<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MenuItem extends Model implements HasMedia
{
    use InteractsWithMedia;
    protected $fillable = [
        'tenant_id',
        'category_id',
        'name',
        'name_ar',
        'description',
        'description_ar',
        'image',
        'price',
        'has_sizes',
        'sizes',
        'has_addons',
        'is_available',
        'sort_order',
        'preparation_type',
        'estimated_preparation_time',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'has_sizes' => 'boolean',
            'sizes' => 'array',
            'has_addons' => 'boolean',
            'is_available' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class);
    }

    public function addons(): BelongsToMany
    {
        return $this->belongsToMany(ItemAddon::class, 'menu_item_addon', 'menu_item_id', 'addon_id');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('main_image')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

        $this->addMediaCollection('gallery')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    }

    public function registerMediaConversions(Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(300)
            ->height(300)
            ->sharpen(10)
            ->performOnCollections('main_image', 'gallery');

        $this->addMediaConversion('preview')
            ->width(800)
            ->height(800)
            ->performOnCollections('main_image', 'gallery');
    }
}
