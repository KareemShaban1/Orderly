import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
	id: number;
	name: string;
	name_ar: string;
	description?: string;
	image?: string;
	price: number;
	has_sizes: boolean;
	sizes?: any[];
	has_addons: boolean;
	addons?: any[];
}

interface Category {
	id: number;
	name: string;
	name_ar: string;
	items: MenuItem[];
}

interface CartItem {
	menu_item_id: number;
	name: string;
	price: number;
	quantity: number;
	size?: string;
	selected_addons?: number[];
	special_instructions?: string;
	unit_price: number;
	addons_price: number;
}

interface Table {
	id: number;
	table_number: string;
	capacity: number;
	status: string;
	branch_id: number;
	branch_name: string;
}

interface Branch {
	id: number;
	name: string;
	address?: string;
}

function CashierScreen() {
	const { user: _user } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
	const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [customerType, setCustomerType] = useState<'walk_in' | 'table'>('walk_in');
	const [selectedTable, setSelectedTable] = useState<number | null>(null);
	const [customerName, setCustomerName] = useState('');
	const [discount, setDiscount] = useState(0);
	const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
	const [itemStates, setItemStates] = useState<Record<number, {
		quantity: number;
		size: string;
		addons: number[];
		instructions: string;
	}>>({});
	const [searchQuery, setSearchQuery] = useState('');
	const [showReceipt, setShowReceipt] = useState(false);
	const [lastOrder, setLastOrder] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Fetch branches
	const { data: branches } = useQuery({
		queryKey: ['pos-branches'],
		queryFn: async () => {
			const response = await apiClient.get('/admin/pos/branches');
			return response.data.data;
		},
	});

	// Fetch menu items
	const { data: menuData, isLoading: menuLoading, error: menuError } = useQuery({
		queryKey: ['pos-menu-items', selectedBranch],
		queryFn: async () => {
			const response = await apiClient.get('/admin/pos/menu-items', {
				params: { branch_id: selectedBranch },
			});
			return response.data.data;
		},
		enabled: !!selectedBranch,
	});

	// Fetch tables
	const { data: tables } = useQuery({
		queryKey: ['pos-tables', selectedBranch],
		queryFn: async () => {
			const response = await apiClient.get('/admin/pos/tables', {
				params: { branch_id: selectedBranch },
			});
			return response.data.data;
		},
		enabled: !!selectedBranch && customerType === 'table',
	});

	// Set first branch as default
	useEffect(() => {
		if (branches && branches.length > 0 && !selectedBranch) {
			setSelectedBranch(branches[0].id);
		}
	}, [branches, selectedBranch]);

	// Filter menu items by search
	const filteredMenu = menuData?.map((category: Category) => ({
		...category,
		items: category.items.filter((item) =>
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.name_ar?.toLowerCase().includes(searchQuery.toLowerCase())
		),
	})).filter((category: Category) => category.items.length > 0) || [];

	// Calculate cart totals
	const calculateTotals = () => {
		const subtotal = cart.reduce((sum, item) => {
			const itemTotal = (item.unit_price + item.addons_price) * item.quantity;
			return sum + itemTotal;
		}, 0);

		let discountAmount = 0;
		if (discount > 0) {
			if (discountType === 'percentage') {
				discountAmount = (subtotal * discount) / 100;
			} else {
				discountAmount = discount;
			}
		}

		const taxRate = 14; // Default tax rate, should come from settings
		const serviceChargeRate = 10; // Default service charge, should come from settings

		const taxableAmount = subtotal - discountAmount;
		const tax = (taxableAmount * taxRate) / 100;
		const serviceCharge = (taxableAmount * serviceChargeRate) / 100;
		const total = taxableAmount + tax + serviceCharge;

		return { subtotal, discountAmount, tax, serviceCharge, total };
	};

	const totals = calculateTotals();

	// Get or initialize item state
	const getItemState = (itemId: number) => {
		if (!itemStates[itemId]) {
			return { quantity: 1, size: '', addons: [], instructions: '' };
		}
		return itemStates[itemId];
	};

	// Update item state
	const updateItemState = (itemId: number, updates: Partial<{
		quantity: number;
		size: string;
		addons: number[];
		instructions: string;
	}>) => {
		setItemStates(prev => ({
			...prev,
			[itemId]: { ...getItemState(itemId), ...updates }
		}));
	};

	// Add item to cart
	const addToCart = (item: MenuItem) => {
		const state = getItemState(item.id);

		const addonsPrice = item.addons
			?.filter((addon) => state.addons.includes(addon.id))
			.reduce((sum, addon) => sum + addon.price, 0) || 0;

		const unitPrice = state.size && item.sizes
			? item.sizes.find((s: any) => s.name === state.size)?.price || item.price
			: item.price;

		const cartItem: CartItem = {
			menu_item_id: item.id,
			name: item.name,
			price: item.price,
			quantity: state.quantity,
			size: state.size || undefined,
			selected_addons: state.addons.length > 0 ? state.addons : undefined,
			special_instructions: state.instructions || undefined,
			unit_price: unitPrice,
			addons_price: addonsPrice,
		};

		setCart([...cart, cartItem]);
		// Reset item state after adding to cart
		updateItemState(item.id, { quantity: 1, size: '', addons: [], instructions: '' });
	};

	const removeFromCart = (index: number) => {
		setCart(cart.filter((_, i) => i !== index));
	};

	const updateCartQuantity = (index: number, quantity: number) => {
		if (quantity < 1) return;
		const newCart = [...cart];
		newCart[index].quantity = quantity;
		setCart(newCart);
	};

	// Create order mutation
	const createOrderMutation = useMutation({
		mutationFn: async (paymentMethod: string) => {
			const response = await apiClient.post('/admin/pos/orders', {
				branch_id: selectedBranch,
				table_id: customerType === 'table' ? selectedTable : null,
				customer_type: customerType,
				customer_name: customerName || undefined,
				items: cart.map((item) => ({
					menu_item_id: item.menu_item_id,
					quantity: item.quantity,
					size: item.size,
					selected_addons: item.selected_addons,
					special_instructions: item.special_instructions,
				})),
				discount: discount || undefined,
				discount_type: discountType,
				payment_method: paymentMethod,
				payment_status: paymentMethod ? 'paid' : 'pending',
			});
			return response.data;
		},
		onSuccess: (data) => {
			setLastOrder(data.data);
			setShowReceipt(true);
			setCart([]);
			setCustomerName('');
			setDiscount(0);
			setSelectedTable(null);
			setError(null);
			setSuccess('Order created successfully!');
			queryClient.invalidateQueries({ queryKey: ['orders'] });
			queryClient.invalidateQueries({ queryKey: ['pos-tables'] });
			setTimeout(() => setSuccess(null), 3000);
		},
		onError: (err: any) => {
			const errorMessage = err.response?.data?.message || 'Failed to create order. Please try again.';
			setError(errorMessage);
			setSuccess(null);
			setTimeout(() => setError(null), 5000);
		},
	});

	const handleCheckout = (paymentMethod: string) => {
		if (cart.length === 0) {
			setError('Cart is empty. Please add items to cart.');
			setTimeout(() => setError(null), 3000);
			return;
		}
		if (!selectedBranch) {
			setError('Please select a branch.');
			setTimeout(() => setError(null), 3000);
			return;
		}
		if (customerType === 'table' && !selectedTable) {
			setError('Please select a table for table orders.');
			setTimeout(() => setError(null), 3000);
			return;
		}
		setError(null);
		createOrderMutation.mutate(paymentMethod);
	};

	const handleNewOrder = () => {
		setShowReceipt(false);
		setLastOrder(null);
		setCart([]);
		setCustomerName('');
		setDiscount(0);
		setSelectedTable(null);
	};

	if (showReceipt && lastOrder) {
		return (
			<div className="min-h-screen bg-slate-50 p-4">
				<div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
					<div className="text-center mb-4">
						<h2 className="text-xl font-bold text-slate-900 mb-1">Order Receipt</h2>
						<p className="text-base text-slate-600">Order #{lastOrder.order_number}</p>
					</div>

					<div className="space-y-2 mb-4 text-sm">
						<div className="flex justify-between">
							<span className="text-slate-600">Date:</span>
							<span className="font-medium">{new Date(lastOrder.created_at).toLocaleString()}</span>
						</div>
						{lastOrder.table && (
							<div className="flex justify-between">
								<span className="text-slate-600">Table:</span>
								<span className="font-medium">{lastOrder.table.table_number}</span>
							</div>
						)}
						{customerName && (
							<div className="flex justify-between">
								<span className="text-slate-600">Customer:</span>
								<span className="font-medium">{customerName}</span>
							</div>
						)}
					</div>

					<div className="border-t border-b border-slate-200 py-3 mb-3">
						<div className="space-y-2">
							{lastOrder.items?.map((item: any, index: number) => {
								const itemTotalPrice = parseFloat(item.total_price) || 0;
								return (
									<div key={index} className="flex justify-between items-start">
										<div className="flex-1">
											<p className="font-semibold text-sm text-slate-900">{item.item_name}</p>
											{item.size && (
												<p className="text-xs text-slate-600 mt-0.5">Size: <span className="font-medium">{item.size}</span></p>
											)}
											{item.selected_addons && item.selected_addons.length > 0 && (
												<div className="mt-1">
													<p className="text-xs text-slate-500 mb-0.5">Add-ons:</p>
													<div className="flex flex-wrap gap-1">
														{item.selected_addons.map((addon: any, idx: number) => (
															<span key={idx} className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
																{addon.name}
															</span>
														))}
													</div>
												</div>
											)}
											<p className="text-xs text-slate-600 mt-0.5">Quantity: <span className="font-medium">{item.quantity}</span></p>
										</div>
										<div className="text-right ml-3">
											<p className="font-bold text-sm text-slate-900">{itemTotalPrice.toFixed(2)} EGP</p>
											{item.quantity > 1 && (
												<p className="text-xs text-slate-500">
													{(itemTotalPrice / item.quantity).toFixed(2)} each
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>

					<div className="space-y-2 mb-3 text-sm">
						<div className="flex justify-between">
							<span className="text-slate-600">Subtotal:</span>
							<span className="font-semibold">{(parseFloat(lastOrder.subtotal) || 0).toFixed(2)} EGP</span>
						</div>
						{(parseFloat(lastOrder.discount) || 0) > 0 && (
							<div className="flex justify-between text-emerald-600">
								<span>Discount:</span>
								<span className="font-semibold">-{(parseFloat(lastOrder.discount) || 0).toFixed(2)} EGP</span>
							</div>
						)}
						<div className="flex justify-between">
							<span className="text-slate-600">Tax:</span>
							<span className="font-semibold">{(parseFloat(lastOrder.tax_amount) || 0).toFixed(2)} EGP</span>
						</div>
						<div className="flex justify-between">
							<span className="text-slate-600">Service Charge:</span>
							<span className="font-semibold">{(parseFloat(lastOrder.service_charge) || 0).toFixed(2)} EGP</span>
						</div>
						<div className="flex justify-between text-xl font-bold border-t border-slate-300 pt-2 mt-2">
							<span>Total:</span>
							<span className="text-slate-900">{(parseFloat(lastOrder.total) || 0).toFixed(2)} EGP</span>
						</div>
						{lastOrder.payments && lastOrder.payments.length > 0 && (
							<div className="mt-3 pt-3 border-t border-slate-200">
								<p className="text-sm font-medium text-slate-700 mb-1">Payment:</p>
								{lastOrder.payments.map((payment: any, idx: number) => (
									<div key={idx} className="flex justify-between text-sm">
										<span className="text-slate-600 capitalize">{payment.payment_method?.replace('_', ' ') || 'N/A'}</span>
										<span className="font-semibold text-emerald-600">{(parseFloat(payment.amount) || 0).toFixed(2)} EGP</span>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="flex space-x-3 mt-4">
						<button
							onClick={() => window.print()}
							className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
						>
							Print Receipt
						</button>
						<button
							onClick={handleNewOrder}
							className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
						>
							New Order
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
			{/* Header - Full Width */}
			<div className="bg-white border-b border-slate-300 p-4 shadow-sm">
				<div className="flex items-center justify-between mb-3">
					<h1 className="text-xl font-bold text-slate-900">Cashier Screen</h1>
					<div className="flex items-center space-x-3">
						<button
							onClick={() => navigate('/pos')}
							className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium text-sm rounded-lg transition-colors"
						>
							Back to Admin
						</button>
						<select
							value={selectedBranch || ''}
							onChange={(e) => setSelectedBranch(Number(e.target.value))}
							className="px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-medium"
						>
							<option value="">Select Branch</option>
							{branches?.map((branch: Branch) => (
								<option key={branch.id} value={branch.id}>
									{branch.name}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Success/Error Messages */}
				{success && (
					<div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center justify-between text-sm">
						<div className="flex items-center space-x-2">
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
							</svg>
							<span>{success}</span>
						</div>
						<button onClick={() => setSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				)}

				{error && (
					<div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between text-sm">
						<div className="flex items-center space-x-2">
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
							<span>{error}</span>
						</div>
						<button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				)}

				{/* Customer Type Selection */}
				<div className="flex items-center space-x-3">
					<div className="flex space-x-2">
						<button
							onClick={() => {
								setCustomerType('walk_in');
								setSelectedTable(null);
							}}
							className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${customerType === 'walk_in'
								? 'bg-slate-900 text-white'
								: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
								}`}
						>
							Walk-In
						</button>
						<button
							onClick={() => setCustomerType('table')}
							className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${customerType === 'table'
								? 'bg-slate-900 text-white'
								: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
								}`}
						>
							Table
						</button>
					</div>

					{customerType === 'table' && (
						<select
							value={selectedTable || ''}
							onChange={(e) => setSelectedTable(Number(e.target.value))}
							className="px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-medium"
						>
							<option value="">Select Table</option>
							{tables?.map((table: Table) => (
								<option key={table.id} value={table.id}>
									Table {table.table_number} ({table.status})
								</option>
							))}
						</select>
					)}

					<input
						type="text"
						placeholder="Customer Name (Optional)"
						value={customerName}
						onChange={(e) => setCustomerName(e.target.value)}
						className="px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
					/>
				</div>
			</div>

			{/* Main Content - Full Width */}
			<div className="flex-1 flex overflow-hidden">
				{/* Product Grid - Takes more space */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Search */}
					<div className="p-3 bg-white border-b border-slate-200">
						<input
							type="text"
							placeholder="Search items..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
						/>
					</div>

					{/* Categories */}
					<div className="p-3 bg-white border-b border-slate-200 overflow-x-auto">
						<div className="flex space-x-2">
							<button
								onClick={() => setSelectedCategory(null)}
								className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${selectedCategory === null
									? 'bg-slate-900 text-white'
									: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
									}`}
							>
								All
							</button>
							{filteredMenu.map((category: Category) => (
								<button
									key={category.id}
									onClick={() => setSelectedCategory(category.id)}
									className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${selectedCategory === category.id
										? 'bg-slate-900 text-white'
										: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
										}`}
								>
									{category.name}
								</button>
							))}
						</div>
					</div>

					{/* Products */}
					<div className="flex-1 overflow-y-auto p-3">
						{menuLoading && (
							<div className="flex items-center justify-center h-full">
								<p className="text-slate-600 text-sm">Loading menu items...</p>
							</div>
						)}
						{menuError && (
							<div className="flex items-center justify-center h-full">
								<p className="text-red-600 text-sm">Error loading menu: {String(menuError)}</p>
							</div>
						)}
						{!menuLoading && !menuError && (!menuData || filteredMenu.length === 0) && (
							<div className="flex items-center justify-center h-full">
								<div className="text-center">
									<p className="text-slate-600 mb-2 text-sm">No menu items available.</p>
									<p className="text-xs text-slate-500">Please add categories and items in Menu Management.</p>
								</div>
							</div>
						)}
						{!menuLoading && !menuError && filteredMenu.length > 0 && (
							<div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
								{(selectedCategory
									? filteredMenu.find((c: Category) => c.id === selectedCategory)?.items || []
									: filteredMenu.flatMap((c: Category) => c.items)
								).map((item: MenuItem) => {
									const state = getItemState(item.id);
									const selectedSizePrice = state.size && item.sizes
										? item.sizes.find((s: any) => s.name === state.size)?.price || item.price
										: item.price;
									const addonsPrice = item.addons
										?.filter((addon) => state.addons.includes(addon.id))
										.reduce((sum, addon) => sum + addon.price, 0) || 0;
									const totalPrice = (selectedSizePrice + addonsPrice) * state.quantity;
									const hasAddons = item.has_addons && item.addons && item.addons.length > 0;
									const hasSizes = item.has_sizes && item.sizes && item.sizes.length > 0;

									return (
										<div
											key={item.id}
											className="bg-white rounded-lg border border-slate-200 hover:border-slate-900 hover:shadow-md transition-all flex flex-col cursor-pointer group"
											onClick={(e) => {
												e.stopPropagation();
												addToCart(item);
											}}
										>
											{/* Item Image */}
											<div className="relative h-32 bg-slate-100 rounded-t-lg overflow-hidden">
												{item.image ? (
													<img
														src={item.image}
														alt={item.name}
														className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
														</svg>
													</div>
												)}
												{/* Quantity Badge */}
												{state.quantity > 1 && (
													<div className="absolute top-1 right-1 bg-slate-900 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shadow">
														{state.quantity}
													</div>
												)}
											</div>

											{/* Item Info */}
											<div className="p-2 flex-1 flex flex-col">
												<h3 className="font-semibold text-slate-900 text-xs mb-1 line-clamp-2">{item.name}</h3>

												{/* Price Display */}
												<div className="mb-2">
													<p className="text-sm font-bold text-slate-900">
														{totalPrice.toFixed(2)} <span className="text-xs font-normal text-slate-600">EGP</span>
													</p>
													{state.quantity > 1 && (
														<p className="text-xs text-slate-500">
															{(selectedSizePrice + addonsPrice).toFixed(2)} EGP each
														</p>
													)}
												</div>

												{/* Sizes */}
												{hasSizes && (
													<div className="mb-2">
														<div className="flex flex-wrap gap-1">
															{item.sizes!.map((size: any) => (
																<button
																	key={size.name}
																	onClick={(e) => {
																		e.stopPropagation();
																		updateItemState(item.id, { size: state.size === size.name ? '' : size.name });
																	}}
																	className={`px-2 py-1 text-xs rounded font-medium transition-all ${state.size === size.name
																		? 'bg-slate-900 text-white'
																		: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
																		}`}
																>
																	{size.name}
																</button>
															))}
														</div>
													</div>
												)}

												{/* Addons */}
												{hasAddons && (
													<div className="mb-2">
														<div className="text-xs font-medium text-slate-600 mb-1">Add-ons:</div>
														<div className="space-y-1 max-h-24 overflow-y-auto">
															{item.addons!.map((addon: any) => (
																<label
																	key={addon.id}
																	className="flex items-center justify-between p-1 rounded border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors"
																	onClick={(e) => e.stopPropagation()}
																>
																	<div className="flex items-center space-x-1">
																		<input
																			type="checkbox"
																			checked={state.addons.includes(addon.id)}
																			onChange={(e) => {
																				if (e.target.checked) {
																					updateItemState(item.id, { addons: [...state.addons, addon.id] });
																				} else {
																					updateItemState(item.id, { addons: state.addons.filter(id => id !== addon.id) });
																				}
																			}}
																			className="w-3 h-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
																		/>
																		<span className="text-xs text-slate-900">{addon.name}</span>
																	</div>
																	<span className="text-xs font-semibold text-slate-700">+{addon.price.toFixed(2)}</span>
																</label>
															))}
														</div>
													</div>
												)}

												{/* Quick Actions */}
												<div className="mt-auto pt-2 border-t border-slate-200">
													<div className="flex items-center flex-col justify-between gap-2">
														<div className="flex items-center gap-2 bg-slate-50 rounded px-2 py-1.5">
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	if (state.quantity > 1) {
																		updateItemState(item.id, { quantity: state.quantity - 1 });
																	}
																}}
																className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 font-bold text-slate-700 text-sm transition-colors"
															>
																−
															</button>
															<span className="w-8 text-center font-bold text-slate-900 text-sm">{state.quantity}</span>
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	updateItemState(item.id, { quantity: state.quantity + 1 });
																}}
																className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 font-bold text-slate-700 text-sm transition-colors"
															>
																+
															</button>
														</div>
														<button
															onClick={(e) => {
																e.stopPropagation();
																addToCart(item);
															}}
															className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 px-2 rounded text-xs transition-colors"
														>
															Add to Cart
														</button>
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>

				{/* Cart Sidebar */}
				<div className="w-80 bg-white border-l border-slate-300 flex flex-col shadow-lg">
					<div className="p-3 border-b border-slate-200 bg-slate-50">
						<h2 className="text-lg font-bold text-slate-900">Cart ({cart.length})</h2>
					</div>

					<div className="flex-1 overflow-y-auto p-3 space-y-2">
						{cart.length === 0 ? (
							<div className="text-center text-slate-500 py-8">
								<p className="text-sm">Cart is empty</p>
							</div>
						) : (
							cart.map((item, index) => (
								<div key={index} className="bg-slate-50 rounded-lg p-2 border border-slate-200">
									<div className="flex justify-between items-start mb-2">
										<div className="flex-1">
											<p className="font-semibold text-sm text-slate-900">{item.name}</p>
											{item.size && <p className="text-xs text-slate-600 mt-0.5">Size: {item.size}</p>}
											<p className="text-sm font-bold text-slate-900 mt-1">
												{((item.unit_price + item.addons_price) * item.quantity).toFixed(2)} EGP
											</p>
										</div>
										<button
											onClick={() => removeFromCart(index)}
											className="text-red-600 hover:text-red-800 p-1"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
									<div className="flex items-center space-x-2">
										<button
											onClick={() => updateCartQuantity(index, item.quantity - 1)}
											className="w-7 h-7 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-200 font-bold text-sm"
										>
											−
										</button>
										<span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
										<button
											onClick={() => updateCartQuantity(index, item.quantity + 1)}
											className="w-7 h-7 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-200 font-bold text-sm"
										>
											+
										</button>
									</div>
								</div>
							))
						)}
					</div>

					{/* Totals */}
					<div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
						<div className="flex justify-between text-sm">
							<span className="font-medium">Subtotal:</span>
							<span className="font-bold">{totals.subtotal.toFixed(2)} EGP</span>
						</div>
						<div className="flex items-center space-x-2">
							<input
								type="number"
								placeholder="Discount"
								value={discount || ''}
								onChange={(e) => setDiscount(Number(e.target.value))}
								className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm font-medium"
							/>
							<select
								value={discountType}
								onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
								className="px-2 py-1.5 border border-slate-300 rounded text-sm font-medium"
							>
								<option value="fixed">EGP</option>
								<option value="percentage">%</option>
							</select>
						</div>
						{totals.discountAmount > 0 && (
							<div className="flex justify-between text-sm text-emerald-600">
								<span className="font-medium">Discount:</span>
								<span className="font-bold">-{totals.discountAmount.toFixed(2)} EGP</span>
							</div>
						)}
						<div className="flex justify-between text-sm">
							<span className="font-medium">Tax:</span>
							<span className="font-bold">{totals.tax.toFixed(2)} EGP</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="font-medium">Service Charge:</span>
							<span className="font-bold">{totals.serviceCharge.toFixed(2)} EGP</span>
						</div>
						<div className="flex justify-between font-bold text-lg border-t border-slate-300 pt-2 mt-2">
							<span>Total:</span>
							<span className="text-slate-900">{totals.total.toFixed(2)} EGP</span>
						</div>

						{/* Payment Buttons */}
						<div className="space-y-2 mt-4">
							<button
								onClick={() => handleCheckout('cash')}
								disabled={cart.length === 0 || createOrderMutation.isPending || !selectedBranch}
								className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-sm rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow"
							>
								{createOrderMutation.isPending ? (
									<>
										<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										<span>Processing...</span>
									</>
								) : (
									<>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
										<span>Cash Payment</span>
									</>
								)}
							</button>

							<div className="grid grid-cols-2 gap-2">
								<button
									onClick={() => handleCheckout('card')}
									disabled={cart.length === 0 || createOrderMutation.isPending || !selectedBranch}
									className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 text-sm rounded-lg flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
									</svg>
									<span>Card</span>
								</button>
								<button
									onClick={() => handleCheckout('vodafone_cash')}
									disabled={cart.length === 0 || createOrderMutation.isPending || !selectedBranch}
									className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 text-sm rounded-lg flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
									</svg>
									<span>Vodafone</span>
								</button>
							</div>

							<button
								onClick={() => handleCheckout('')}
								disabled={cart.length === 0 || createOrderMutation.isPending || !selectedBranch}
								className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-2 text-sm rounded-lg flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<span>Hold Order</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default CashierScreen;

