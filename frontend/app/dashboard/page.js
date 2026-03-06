'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
    LogOut,
    Home,
    User,
    UploadCloud,
    Receipt,
    Bot,
    BookOpen,
    BarChart2,
    MessageSquare,
    ChefHat,
    ChevronRight,
    Sparkles,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState(null);
    const [activeNav, setActiveNav] = useState('home');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        axios
            .get(`${API_URL}/restaurant/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setRestaurant(res.data.restaurant);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const features = [
        {
            icon: <UploadCloud className="w-8 h-8" />,
            title: 'Upload CSV',
            desc: 'Import your menu, orders, or sales data from a spreadsheet.',
            color: 'from-blue-600/20 to-blue-600/5',
            accent: 'text-blue-400',
            border: 'hover:border-blue-500/50',
            badge: 'Data Import',
        },
        {
            icon: <Receipt className="w-8 h-8" />,
            title: 'Manual Billing',
            desc: 'Create and manage bills for dine-in, takeaway, or delivery.',
            color: 'from-emerald-600/20 to-emerald-600/5',
            accent: 'text-emerald-400',
            border: 'hover:border-emerald-500/50',
            badge: 'POS',
        },
        {
            icon: <Bot className="w-8 h-8" />,
            title: 'AI Call',
            desc: 'Intelligent voice assistant for hands-free restaurant operations.',
            color: 'from-orange-600/20 to-orange-600/5',
            accent: 'text-orange-400',
            border: 'hover:border-orange-500/50',
            badge: 'AI Powered',
            featured: true,
        },
        {
            icon: <BookOpen className="w-8 h-8" />,
            title: 'Menu Doctor',
            desc: 'AI-powered menu analysis to boost item profitability and appeal.',
            color: 'from-purple-600/20 to-purple-600/5',
            accent: 'text-purple-400',
            border: 'hover:border-purple-500/50',
            badge: 'AI Powered',
        },
        {
            icon: <BarChart2 className="w-8 h-8" />,
            title: 'Business Insights',
            desc: 'Deep analytics on sales trends, customer habits, and peak hours.',
            color: 'from-cyan-600/20 to-cyan-600/5',
            accent: 'text-cyan-400',
            border: 'hover:border-cyan-500/50',
            badge: 'Analytics',
        },
        {
            icon: <MessageSquare className="w-8 h-8" />,
            title: 'Feedback Form',
            desc: 'Collect and review real-time customer feedback and ratings.',
            color: 'from-pink-600/20 to-pink-600/5',
            accent: 'text-pink-400',
            border: 'hover:border-pink-500/50',
            badge: 'Engagement',
        },
    ];

    const navItems = [
        { id: 'home', icon: <Home className="w-4 h-4" />, label: 'Home Page' },
        { id: 'profile', icon: <User className="w-4 h-4" />, label: 'My Profile' },
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col">
            {/* Top Navbar */}
            <header className="h-16 border-b border-white/5 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                        <ChefHat className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">PetPooja</span>
                </div>

                {/* Restaurant Name Center */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold text-neutral-200">
                        {restaurant?.restaurantName || 'My Restaurant'}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-56 border-r border-white/5 hidden md:flex flex-col py-6 px-3 gap-1 sticky top-16 h-[calc(100vh-64px)]">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveNav(item.id)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition w-full text-left ${activeNav === item.id
                                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {/* Hero Welcome Banner */}
                    <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-br from-orange-500/10 via-neutral-900 to-neutral-900 p-8 mb-10">
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">Your Command Center</p>
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
                            Welcome back,{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                                {restaurant?.ownerName?.split(' ')[0] || 'Chef'}
                            </span>
                            ! 👋
                        </h1>
                        <p className="text-neutral-400 max-w-xl text-sm leading-relaxed">
                            Everything you need to run <strong className="text-white">{restaurant?.restaurantName || 'your restaurant'}</strong> is right here. Pick a module below to get started.
                        </p>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((feature) => (
                            <button
                                key={feature.title}
                                className={`relative group text-left p-6 rounded-2xl bg-gradient-to-br ${feature.color} border border-white/5 ${feature.border} transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 ${feature.featured ? 'ring-1 ring-orange-500/30' : ''}`}
                            >
                                {feature.featured && (
                                    <div className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-full shadow-lg">
                                        ✨ Featured
                                    </div>
                                )}
                                <div className={`${feature.accent} mb-5`}>{feature.icon}</div>
                                <div className="mb-2 flex items-center gap-2">
                                    <h3 className="text-base font-bold">{feature.title}</h3>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-current opacity-60 ${feature.accent}`}>
                                        {feature.badge}
                                    </span>
                                </div>
                                <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
                                <div className={`mt-4 flex items-center gap-1 text-xs font-semibold ${feature.accent} opacity-0 group-hover:opacity-100 transition`}>
                                    Open module <ChevronRight className="w-3 h-3" />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Restaurant Info Footer Card */}
                    {restaurant && (
                        <div className="mt-10 p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-wrap gap-6 items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                                    <ChefHat className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 font-medium">Restaurant</p>
                                    <p className="text-sm font-bold">{restaurant.restaurantName}</p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-white/5 hidden sm:block"></div>
                            <InfoChip label="Owner" value={restaurant.ownerName} />
                            <InfoChip label="GST" value={restaurant.gstNumber} />
                            <InfoChip label="Phone" value={restaurant.phone} />
                            <InfoChip label="Email" value={restaurant.email} />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function InfoChip({ label, value }) {
    return (
        <div>
            <p className="text-xs text-neutral-500 font-medium">{label}</p>
            <p className="text-sm font-semibold text-neutral-200">{value}</p>
        </div>
    );
}
