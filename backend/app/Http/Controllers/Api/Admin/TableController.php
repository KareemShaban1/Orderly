<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Table;
use App\Models\Branch;
use App\Services\QrCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TableController extends Controller
{
    protected $qrCodeService;

    public function __construct(QrCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    /**
     * Get full URL for storage file
     */
    private function getStorageUrl(string $path): string
    {
        $url = Storage::url($path);
        // If it's a relative URL, prepend the APP_URL with correct port
        if (!str_starts_with($url, 'http')) {
            $appUrl = config('app.url');
            // If URL doesn't have a port, try to get it from environment or default to 8001
            $parsed = parse_url($appUrl);
            if (!isset($parsed['port'])) {
                $port = env('APP_PORT', '8001');
                $scheme = $parsed['scheme'] ?? 'http';
                $host = $parsed['host'] ?? 'localhost';
                $appUrl = $scheme . '://' . $host . ':' . $port;
            }
            $url = rtrim($appUrl, '/') . $url;
        }
        return $url;
    }

    public function index(Request $request)
    {
        $query = Table::with(['branch']);
        
        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }
        
        $tables = $query->orderBy('table_number')->get()->map(function ($table) {
            if ($table->qr_code_image) {
                $table->qr_code_image_url = $this->getStorageUrl($table->qr_code_image);
            }
            return $table;
        });
        
        return response()->json($tables);
    }

    public function show($id)
    {
        $table = Table::with(['branch', 'orders'])->findOrFail($id);
        if ($table->qr_code_image) {
            $table->qr_code_image_url = $this->getStorageUrl($table->qr_code_image);
        }
        return response()->json($table);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'table_number' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1|max:50',
        ]);

        // Check if table number already exists for this branch
        $existing = Table::where('branch_id', $validated['branch_id'])
            ->where('table_number', $validated['table_number'])
            ->first();
            
        if ($existing) {
            return response()->json(['message' => 'Table number already exists for this branch'], 422);
        }

        $qrCode = $this->qrCodeService->generateUniqueCode();
        
        $table = Table::create([
            'branch_id' => $validated['branch_id'],
            'table_number' => $validated['table_number'],
            'capacity' => $validated['capacity'],
            'qr_code' => $qrCode,
            'status' => 'available',
        ]);

        // Generate QR code image
        $this->qrCodeService->generateForTable($table);
        
        // Refresh to get updated qr_code_image
        $table->refresh();
        if ($table->qr_code_image) {
            $table->qr_code_image_url = $this->getStorageUrl($table->qr_code_image);
        }

        return response()->json($table, 201);
    }

    public function update(Request $request, $id)
    {
        $table = Table::findOrFail($id);
        
        $validated = $request->validate([
            'table_number' => 'sometimes|string|max:255',
            'capacity' => 'sometimes|integer|min:1|max:50',
            'status' => 'sometimes|in:available,occupied,reserved,out_of_service',
            'is_active' => 'sometimes|boolean',
        ]);

        // Check if table number already exists (if changed)
        if (isset($validated['table_number']) && $validated['table_number'] !== $table->table_number) {
            $existing = Table::where('branch_id', $table->branch_id)
                ->where('table_number', $validated['table_number'])
                ->where('id', '!=', $id)
                ->first();
                
            if ($existing) {
                return response()->json(['message' => 'Table number already exists for this branch'], 422);
            }
        }

        $table->update($validated);
        $table->refresh();
        if ($table->qr_code_image) {
            $table->qr_code_image_url = $this->getStorageUrl($table->qr_code_image);
        }
        return response()->json($table);
    }

    public function destroy($id)
    {
        $table = Table::findOrFail($id);
        $table->delete();
        return response()->json(['message' => 'Table deleted successfully']);
    }

    public function regenerateQrCode(Table $table)
    {
        $qrCode = $this->qrCodeService->generateUniqueCode();
        
        $table->update(['qr_code' => $qrCode]);
        $this->qrCodeService->generateForTable($table);
        
        $table->refresh();
        if ($table->qr_code_image) {
            $table->qr_code_image_url = $this->getStorageUrl($table->qr_code_image);
        }
        
        return response()->json([
            'message' => 'QR code regenerated successfully',
            'table' => $table,
        ]);
    }

    public function downloadQrCode(Table $table)
    {
        if (!$table->qr_code_image) {
            // Generate QR code if it doesn't exist
            $this->qrCodeService->generateForTable($table);
            $table->refresh();
        }
        
        if (!Storage::disk('public')->exists($table->qr_code_image)) {
            return response()->json(['message' => 'QR code image not found'], 404);
        }
        
        $filePath = Storage::disk('public')->path($table->qr_code_image);
        $extension = strtolower(pathinfo($table->qr_code_image, PATHINFO_EXTENSION));
        
        // If file is SVG, convert it to PNG for download
        if ($extension === 'svg') {
            $pngData = $this->convertSvgToPng($filePath);
            if ($pngData) {
                $fileName = 'table-' . $table->table_number . '-qr-code.png';
                return response($pngData, 200, [
                    'Content-Type' => 'image/png',
                    'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
                ]);
            }
        }
        
        // Use the actual file extension
        $mimeType = $extension === 'svg' ? 'image/svg+xml' : 'image/png';
        $fileName = 'table-' . $table->table_number . '-qr-code.' . $extension;
        
        return response()->download($filePath, $fileName, [
            'Content-Type' => $mimeType,
        ]);
    }
    
    /**
     * Convert SVG file to PNG
     */
    private function convertSvgToPng(string $svgFilePath): ?string
    {
        if (!extension_loaded('gd') || !function_exists('imagecreatetruecolor')) {
            return null;
        }
        
        try {
            $svgContent = file_get_contents($svgFilePath);
            if (!$svgContent) {
                return null;
            }
            
            $svg = simplexml_load_string($svgContent);
            if (!$svg) {
                return null;
            }
            
            $size = 300;
            $svgWidth = isset($svg['width']) ? (int)$svg['width'] : $size;
            $scale = $svgWidth != $size ? $size / $svgWidth : 1;
            
            // Create PNG image
            $image = imagecreatetruecolor($size, $size);
            $white = imagecolorallocate($image, 255, 255, 255);
            $black = imagecolorallocate($image, 0, 0, 0);
            imagefill($image, 0, 0, $white);
            
            // Find all rect elements - only draw black ones
            $rects = $svg->xpath('//rect');
            if (count($rects) > 0) {
                foreach ($rects as $rect) {
                    // Check fill attribute - only draw black rectangles
                    $fill = isset($rect['fill']) ? (string)$rect['fill'] : '';
                    // Skip white rectangles or rectangles without fill (background)
                    if ($fill === '#FFFFFF' || $fill === '#ffffff' || $fill === 'white' || $fill === '' || $fill === 'none') {
                        continue;
                    }
                    
                    $x = isset($rect['x']) ? (float)$rect['x'] : 0;
                    $y = isset($rect['y']) ? (float)$rect['y'] : 0;
                    $width = isset($rect['width']) ? (float)$rect['width'] : 0;
                    $height = isset($rect['height']) ? (float)$rect['height'] : 0;
                    
                    $x = (int)($x * $scale);
                    $y = (int)($y * $scale);
                    $width = (int)($width * $scale);
                    $height = (int)($height * $scale);
                    
                    if ($width > 0 && $height > 0) {
                        imagefilledrectangle($image, $x, $y, $x + $width - 1, $y + $height - 1, $black);
                    }
                }
            }
            
            // Output PNG to string
            ob_start();
            imagepng($image);
            $pngData = ob_get_clean();
            imagedestroy($image);
            
            return $pngData;
        } catch (\Exception $e) {
            return null;
        }
    }
}
