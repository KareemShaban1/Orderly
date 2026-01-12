<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <meta name="description" content="Order from {{ $organization->name }} using QR code. Browse menu, customize your order, and enjoy a seamless dining experience.">
    <meta name="theme-color" content="#0f172a">
    <title>{{ $organization->name }} - QR Order</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    @if($organization->logo)
                        <img src="{{ asset('storage/' . $organization->logo) }}" alt="{{ $organization->name }}" class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0">
                    @else
                        <div class="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                    @endif
                    <div class="min-w-0 flex-1">
                        <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate">{{ $organization->name }}</h1>
                        <p class="text-xs sm:text-sm text-slate-600 hidden sm:block">Order with QR Code</p>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <!-- Order Section -->
        <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-12">
            <div class="max-w-2xl mx-auto">
                <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
                    Start Your Order
                </h2>
                <p class="text-sm sm:text-base text-slate-600 text-center mb-6 sm:mb-8 px-2">
                    Scan the QR code on your table or enter your table code to view the menu
                </p>
                
                <div class="space-y-4">
                    <!-- Table Code Input -->
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                            Enter Table Code
                        </label>
                        <div class="flex flex-col sm:flex-row gap-2 sm:gap-2">
                            <input
                                type="text"
                                id="tableCode"
                                placeholder="e.g., TBL-XXXXXXXX"
                                class="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-base sm:text-lg"
                                onkeypress="if(event.key === 'Enter') handleTableSubmit()"
                                autocomplete="off"
                                autocapitalize="off"
                                inputmode="text"
                            />
                            <button
                                onclick="handleTableSubmit()"
                                class="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
                            >
                                Go to Menu
                            </button>
                        </div>
                    </div>
                    
                    <!-- QR Code Scanner -->
                    <div class="pt-4 border-t border-slate-200">
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                            Or Scan QR Code
                        </label>
                        <button
                            onclick="startQRScanner()"
                            class="w-full px-5 sm:px-6 py-2.5 sm:py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            Open QR Scanner
                        </button>
                        <p class="text-xs text-slate-500 mt-2 text-center px-2">
                            Use your phone's camera to scan the QR code on your table
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hero Section -->
        <div class="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-2">
                Welcome to {{ $organization->name }}
            </h2>
            <p class="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-4">
                Browse our menu, customize your order, and enjoy a seamless dining experience.
            </p>
        </div>

        <!-- Branches Section -->
        @if($branches->count() > 0)
            <div class="mb-8 sm:mb-10 lg:mb-12">
                <h3 class="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 px-2">Our Locations</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    @foreach($branches as $branch)
                        <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow">
                            <h4 class="text-lg sm:text-xl font-bold text-slate-900 mb-3">{{ $branch->name }}</h4>
                            <div class="space-y-2 text-xs sm:text-sm text-slate-600">
                                @if($branch->address)
                                    <p class="flex items-center">
                                        <svg class="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {{ $branch->address }}
                                    </p>
                                @endif
                                @if($branch->area && $branch->city && $branch->governorate)
                                    <p class="flex items-center">
                                        <svg class="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {{ $branch->area }}, {{ $branch->city }}, {{ $branch->governorate }}
                                    </p>
                                @endif
                                @if($branch->phone)
                                    <p class="flex items-center">
                                        <svg class="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {{ $branch->phone }}
                                    </p>
                                @endif
                                @if($branch->opening_time && $branch->closing_time)
                                    <p class="flex items-center">
                                        <svg class="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {{ $branch->opening_time }} - {{ $branch->closing_time }}
                                    </p>
                                @endif
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        <!-- How It Works Section -->
        <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-8 sm:mb-10 lg:mb-12">
            <h3 class="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 text-center">How It Works</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                <div class="text-center">
                    <div class="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <span class="text-xl sm:text-2xl font-bold text-white">1</span>
                    </div>
                    <h4 class="text-base sm:text-lg font-semibold text-slate-900 mb-2">Scan QR Code</h4>
                    <p class="text-sm sm:text-base text-slate-600 px-2">Find the QR code on your table and scan it with your phone camera</p>
                </div>
                <div class="text-center">
                    <div class="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <span class="text-xl sm:text-2xl font-bold text-white">2</span>
                    </div>
                    <h4 class="text-base sm:text-lg font-semibold text-slate-900 mb-2">Browse Menu</h4>
                    <p class="text-sm sm:text-base text-slate-600 px-2">View our menu, customize your items, and add them to your cart</p>
                </div>
                <div class="text-center">
                    <div class="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <span class="text-xl sm:text-2xl font-bold text-white">3</span>
                    </div>
                    <h4 class="text-base sm:text-lg font-semibold text-slate-900 mb-2">Place Order</h4>
                    <p class="text-sm sm:text-base text-slate-600 px-2">Submit your order and track its status in real-time</p>
                </div>
            </div>
        </div>

        <!-- Contact Information -->
        @if($organization->phone || $organization->email)
            <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <h3 class="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 text-center">Contact Us</h3>
                <div class="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
                    @if($organization->phone)
                        <a href="tel:{{ $organization->phone }}" class="flex items-center space-x-2 text-slate-700 hover:text-slate-900 text-sm sm:text-base px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span class="break-all">{{ $organization->phone }}</span>
                        </a>
                    @endif
                    @if($organization->email)
                        <a href="mailto:{{ $organization->email }}" class="flex items-center space-x-2 text-slate-700 hover:text-slate-900 text-sm sm:text-base px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span class="break-all">{{ $organization->email }}</span>
                        </a>
                    @endif
                </div>
            </div>
        @endif
    </main>

    <!-- Footer -->
    <footer class="bg-slate-900 text-white mt-12 sm:mt-16 lg:mt-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
            <div class="text-center">
                <h3 class="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 px-2">{{ $organization->name }}</h3>
                <p class="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6 px-4">Order with QR Code - Fast, Easy, and Convenient</p>
                <p class="text-xs sm:text-sm text-slate-500">Powered by QR Order System</p>
            </div>
        </div>
    </footer>

    <script>
        const GUEST_APP_URL = '{{ env("FRONTEND_GUEST_URL", "http://localhost:5173") }}';
        
        function handleTableSubmit() {
            const tableCode = document.getElementById('tableCode').value.trim();
            if (!tableCode) {
                alert('Please enter a table code');
                return;
            }
            // Redirect to guest app with table code
            window.location.href = `${GUEST_APP_URL}/order/${encodeURIComponent(tableCode)}`;
        }
        
        function startQRScanner() {
            // Check if browser supports camera access
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('QR code scanning requires camera access. Please use a device with a camera or enter the table code manually.');
                return;
            }
            
            // Redirect to guest app's scan page
            window.location.href = `${GUEST_APP_URL}/scan`;
        }
        
        // Allow Enter key to submit and improve mobile UX
        document.addEventListener('DOMContentLoaded', function() {
            const input = document.getElementById('tableCode');
            if (input) {
                // Don't auto-focus on mobile to prevent keyboard popup
                if (window.innerWidth > 640) {
                    input.focus();
                }
                
                // Improve mobile input experience
                input.addEventListener('focus', function() {
                    // Scroll input into view on mobile
                    if (window.innerWidth <= 640) {
                        setTimeout(() => {
                            this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                    }
                });
            }
        });
    </script>
</body>
</html>

