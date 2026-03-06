'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
    ChefHat,
    Languages,
    UserCircle,
    UploadCloud,
    Receipt,
    Bot,
    BookOpen,
    BarChart2,
    MessageSquare,
    LogOut,
    Home,
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
        if (!token) { router.push('/'); return; }
        axios
            .get(`${API_URL}/restaurant/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => { setRestaurant(res.data.restaurant); setLoading(false); })
            .catch(() => setLoading(false));
    }, [router]);

    const handleLogout = () => { localStorage.removeItem('token'); router.push('/'); };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col selection:bg-orange-500/30">

            {/* ───── NAVBAR ────────────────────────────────────── */}
            <header className="h-16 border-b border-white/5 bg-neutral-950/90 backdrop-blur-xl sticky top-0 z-50">
                <div className="h-full px-6 flex items-center justify-between">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5 min-w-[140px]">
                        <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-[0_0_18px_rgba(249,115,22,0.5)]">
                            <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-extrabold tracking-tight">PetPooja</span>
                    </div>

                    {/* Restaurant Name — large and centered */}
                    <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-base font-bold text-white tracking-tight">
                            {restaurant?.restaurantName || 'My Restaurant'}
                        </span>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2 min-w-[140px] justify-end">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white border border-white/10 rounded-lg transition">
                            <Languages className="w-3.5 h-3.5" />
                            Language
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white border border-white/10 rounded-lg transition">
                            <UserCircle className="w-3.5 h-3.5" />
                            My Profile
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-400/40 rounded-lg transition"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Log Out
                        </button>
                    </div>
                </div>
            </header>

            {/* ───── BODY ──────────────────────────────────────── */}
            <div className="flex flex-1">

                {/* Sidebar */}
                <aside className="w-52 border-r border-white/5 hidden md:flex flex-col py-6 px-3 gap-1 sticky top-16 h-[calc(100vh-64px)]">
                    {[
                        { id: 'home', icon: <Home className="w-4 h-4" />, label: 'Home Page' },
                        { id: 'profile', icon: <UserCircle className="w-4 h-4" />, label: 'My Profile' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveNav(item.id)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition w-full text-left ${activeNav === item.id
                                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </aside>

                {/* Main */}
                <main className="flex-1 px-8 py-10">
                    <div className="max-w-3xl mx-auto flex flex-col gap-5">

                        {/* ROW 1 — 2 columns */}
                        <div className="grid grid-cols-2 gap-5">
                            <Card
                                icon={<UploadCloud className="w-8 h-8" />}
                                title="Upload CSV"
                                desc="Import your menu, orders, or sales data from a spreadsheet."
                                accent="text-blue-400"
                                glow="from-blue-600/20"
                                ring="hover:border-blue-500/40"
                                badge="Data Import"
                            />
                            <Card
                                icon={<Receipt className="w-8 h-8" />}
                                title="Manual Billing"
                                desc="Create and manage bills for dine-in, takeaway, or delivery."
                                accent="text-emerald-400"
                                glow="from-emerald-600/20"
                                ring="hover:border-emerald-500/40"
                                badge="POS"
                            />
                        </div>

                        {/* ROW 2 — AI Call centered */}
                        <div className="flex justify-center">
                            <div className="w-full max-w-sm">
                                <Card
                                    icon={<Bot className="w-8 h-8" />}
                                    title="AI Call"
                                    desc="Intelligent voice assistant for hands-free restaurant operations."
                                    accent="text-orange-400"
                                    glow="from-orange-600/20"
                                    ring="hover:border-orange-500/40"
                                    badge="AI Powered"
                                    featured
                                />
                            </div>
                        </div>

                        {/* ROW 3 — 2 columns */}
                        <div className="grid grid-cols-2 gap-5">
                            <Card
                                icon={<BookOpen className="w-8 h-8" />}
                                title="Menu Doctor"
                                desc="AI-powered menu analysis to boost item profitability and appeal."
                                accent="text-purple-400"
                                glow="from-purple-600/20"
                                ring="hover:border-purple-500/40"
                                badge="AI Powered"
                            />
                            <Card
                                icon={<BarChart2 className="w-8 h-8" />}
                                title="Business Insights"
                                desc="Deep analytics on sales trends, customer habits, and peak hours."
                                accent="text-cyan-400"
                                glow="from-cyan-600/20"
                                ring="hover:border-cyan-500/40"
                                badge="Analytics"
                            />
                        </div>

                        {/* ROW 4 — Feedback Form centered */}
                        <div className="flex justify-center">
                            <div className="w-full max-w-sm">
                                <Card
                                    icon={<MessageSquare className="w-8 h-8" />}
                                    title="Feedback Form"
                                    desc="Collect and review real-time customer feedback and ratings."
                                    accent="text-pink-400"
                                    glow="from-pink-600/20"
                                    ring="hover:border-pink-500/40"
                                    badge="Engagement"
                                />
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

function Card({ icon, title, desc, accent, glow, ring, badge, featured = false }) {
    return (
        <button
            className={`relative group text-left w-full p-6 rounded-2xl bg-gradient-to-br ${glow} to-transparent border border-white/5 ${ring} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 ${featured ? 'ring-1 ring-orange-500/30' : ''}`}
        >
            {featured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 bg-orange-500 text-white rounded-full shadow whitespace-nowrap">
                    ✨ Featured
                </span>
            )}
            <div className={`${accent} mb-4`}>{icon}</div>
            <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-base font-bold">{title}</h3>
                <span className={`text-[10px] font-semibold border border-current px-2 py-0.5 rounded-full opacity-60 ${accent}`}>
                    {badge}
                </span>
            </div>
            <p className="text-neutral-500 text-xs leading-relaxed">{desc}</p>
        </button>
    );
}
