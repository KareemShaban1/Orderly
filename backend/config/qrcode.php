<?php

return [
    /*
    |--------------------------------------------------------------------------
    | QR Code Backend
    |--------------------------------------------------------------------------
    |
    | This option controls the default backend that is used to generate
    | QR codes. You may set this to any of the backends defined here.
    |
    | Supported: "imagick", "svg", "eps", "png" (GD)
    |
    */

    'format' => 'svg', // Use SVG to avoid Imagick requirement
    
    'size' => 300,
    
    'errorCorrection' => 'H',
    
    'margin' => 1,
    
    'merge' => null,
    
    'mergePercent' => 0.3,
    
    'encoding' => 'UTF-8',
];




