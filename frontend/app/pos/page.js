'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Search, Plus, Minus, FileText, ShoppingCart, User, Printer, Loader2 } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function POSTerminal() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [menuItems, setMenuItems] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [customerName, setCustomerName] = useState('');
    const [cart, setCart] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/'); return; }
        axios.get(`${API_URL}/restaurant/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                setRestaurant(res.data.restaurant);
                setLoading(false);
                fetchMenu(''); // auto fetch all on load
            })
            .catch(() => {
                router.push('/');
            });
    }, [router]);

    const fetchMenu = async (q = '') => {
        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/menu/search`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { q }
            });
            setMenuItems(response.data || []);
        } catch (error) {
            console.error('Failed to fetch menu:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce search
    useEffect(() => {
        if (loading) return;
        const delayDebounceFn = setTimeout(() => {
            fetchMenu(searchQuery);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, loading]);

    const addToCart = (item) => {
        setCart((prev) => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (id, delta) => {
        setCart((prev) => {
            return prev.map(i => {
                if (i.id === id) {
                    const newQ = i.quantity + delta;
                    return newQ > 0 ? { ...i, quantity: newQ } : i;
                }
                return i;
            }).filter(i => i.quantity > 0);
        });
    };

    const cartSubtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

    const handleGenerateBill = async () => {
        if (cart.length === 0) return;
        setIsGenerating(true);

        try {
            const token = localStorage.getItem('token');
            // 1. Create Order
            const orderPayload = {
                customer_name: customerName,
                total_amount: cartSubtotal,
                items: cart
            };

            const orderResponse = await axios.post(`${API_URL}/api/orders/manual`, orderPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const order_id = orderResponse.data.order_id;

            // 2. Generate PDF and auto trigger download
            const pdfResponse = await axios.post(`${API_URL}/api/orders/bill/generate`, { order_id }, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // Create a Blob from the PDF Stream
            const file = new Blob([pdfResponse.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);

            // Open print window / auto-download
            window.open(fileURL, '_blank');

            // Reset after success
            setCart([]);
            setCustomerName('');
            alert('Bill generated and saved successfully!');

        } catch (error) {
            console.error('Generate Bill Error:', error);
            alert('Failed to generate bill or save order. Please check console.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-[#FF6B2C] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans">

            {/* -- LEFT PANEL: MENU SEARCH -- */}
            <div className="w-2/3 flex flex-col border-r border-slate-200 bg-white">

                {/* Header Navbar */}
                <div className="h-16 border-b border-slate-200 flex items-center px-6 shrink-0 justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">Manual Billing POS</h1>
                            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">{restaurant?.restaurantName}</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-6 shrink-0 border-b border-slate-100 bg-white shadow-[0_10px_20px_-10px_rgba(0,0,0,0.05)] z-10">
                    <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by item name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#F1F5F9] border-none text-slate-900 text-base font-medium rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#FF6B2C] focus:bg-white transition-all shadow-inner"
                        />
                        {isSearching && (
                            <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF6B2C] animate-spin" />
                        )}
                    </div>
                </div>

                {/* Menu Items Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
                    {menuItems.length === 0 && !isSearching ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                            <FileText size={48} className="text-slate-200" />
                            <p>No menu items found. Please upload a CSV first.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#FF9F43] hover:shadow-md hover:bg-[#FFF7ED] transition-all duration-200 cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${(item.menu_type || '').toLowerCase().includes('non-veg')
                                                ? 'bg-red-50 text-red-600'
                                                : 'bg-green-50 text-green-600'
                                            }`}>
                                            {item.menu_type || 'veg'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-semibold">{item.category}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-[#FF6B2C] transition-colors">{item.item_name}</h3>
                                    <p className="text-[#FF6B2C] font-extrabold text-lg">₹{item.price}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* -- RIGHT PANEL: ORDER SUMMARY -- */}
            <div className="w-1/3 flex flex-col bg-white">

                {/* Order Header / Customer Input */}
                <div className="p-6 shrink-0 border-b border-slate-200 bg-[#F8FAFC]">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-[#FF6B2C]" />
                        Current Order
                    </h2>

                    <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Walk-in Customer Name (Optional)"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                            <ShoppingCart size={48} className="text-slate-100" />
                            <p className="text-sm font-medium">Cart is empty</p>
                            <p className="text-xs">Add items from the menu</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div key={item.id} className="flex flex-col gap-2 p-4 bg-white border border-slate-100 shadow-sm rounded-2xl group hover:border-slate-200 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-900 leading-tight pr-4">{item.item_name}</h4>
                                        <p className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-sm text-slate-400 font-semibold">₹{item.price} each</p>

                                        {/* Quantity Selector */}
                                        <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="text-slate-500 hover:text-slate-900 p-0.5 hover:bg-white rounded-full transition-colors cursor-pointer"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="text-slate-500 hover:text-slate-900 p-0.5 hover:bg-white rounded-full transition-colors cursor-pointer"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Billing Summary & Actions */}
                <div className="shrink-0 p-6 bg-[#F8FAFC] border-t border-slate-200">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm font-semibold text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{cartSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-slate-500">
                            <span>Taxes & Fees</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-base font-bold text-slate-900">Total Amount</span>
                            <span className="text-2xl font-extrabold text-[#FF6B2C]">₹{cartSubtotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateBill}
                        disabled={cart.length === 0 || isGenerating}
                        className="w-full bg-[#1E293B] hover:bg-[#0F172A] text-white font-bold text-base py-4 rounded-xl shadow-[0_8px_16px_rgba(15,23,42,0.15)] hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                        {isGenerating ? (
                            <><Loader2 size={18} className="animate-spin" /> Processing...</>
                        ) : (
                            <><Printer size={18} /> Generate Bill</>
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
}
