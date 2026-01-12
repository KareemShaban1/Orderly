<?php

namespace App\Services;

use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\QrCode as EndroidQrCode;
use Illuminate\Support\Facades\Storage;
use App\Models\Table;

class QrCodeService
{
    /**
     * Generate QR code for a table
     */
    public function generateForTable(Table $table): string
    {
        $url = config('app.frontend_url') . '/order/' . $table->qr_code;
        
        $filename = 'qr-codes/table-' . $table->id . '-' . time() . '.png';
        $size = 300;
        
        // Generate PNG directly using Endroid QR Code library (supports GD natively)
        try {
            $qrCode = EndroidQrCode::create($url)
                ->setEncoding(new Encoding('UTF-8'))
                ->setErrorCorrectionLevel(ErrorCorrectionLevel::High)
                ->setSize($size)
                ->setMargin(1);
            
            $writer = new PngWriter();
            $result = $writer->write($qrCode);
            
            // Get PNG data
            $pngData = $result->getString();
            
            // Save PNG file
            Storage::disk('public')->put($filename, $pngData);
        } catch (\Exception $e) {
            // Fallback: create a minimal PNG if generation fails
            $pngData = $this->createMinimalPng($size);
            Storage::disk('public')->put($filename, $pngData);
        }
        
        // Update table with QR code image path
        $table->update([
            'qr_code_image' => $filename
        ]);
        
        // Return full URL - use asset() helper which respects APP_URL
        $storageUrl = Storage::url($filename);
        if (!str_starts_with($storageUrl, 'http')) {
            // Get base URL from config, ensuring it includes port if needed
            $appUrl = config('app.url');
            // If URL doesn't have a port, try to get it from environment or default to 8001
            $parsed = parse_url($appUrl);
            if (!isset($parsed['port'])) {
                $port = env('APP_PORT', '8001');
                $scheme = $parsed['scheme'] ?? 'http';
                $host = $parsed['host'] ?? 'localhost';
                $appUrl = $scheme . '://' . $host . ':' . $port;
            }
            $storageUrl = rtrim($appUrl, '/') . $storageUrl;
        }
        return $storageUrl;
    }
    
    /**
     * Create a minimal valid PNG (fallback if generation fails)
     */
    private function createMinimalPng(int $size): string
    {
        if (!extension_loaded('gd') || !function_exists('imagecreatetruecolor')) {
            // If GD is not available, return empty string (should not happen)
            return '';
        }
        
        $image = imagecreatetruecolor($size, $size);
        $white = imagecolorallocate($image, 255, 255, 255);
        imagefill($image, 0, 0, $white);
        
        ob_start();
        imagepng($image);
        $pngData = ob_get_clean();
        imagedestroy($image);
        
        return $pngData;
    }
    
    /**
     * Generate unique QR code string
     */
    public function generateUniqueCode(): string
    {
        do {
            $code = 'TBL-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
        } while (Table::where('qr_code', $code)->exists());
        
        return $code;
    }
}
