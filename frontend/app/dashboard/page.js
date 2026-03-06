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
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState(null);

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
            .catch(() => setLoading(false));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col selection:bg-orange-500/30">

            {/* ───── TOP NAVBAR ───── */}
            <header className="h-16 border-b border-white/5 bg-neutral-950/90 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-[0_0_14px_rgba(249,115,22,0.5)]">
                            <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-base tracking-tight">PetPooja</span>
                    </div>

                    {/* Center: Restaurant Name */}
                    <p className="text-sm font-semibold text-neutral-300 hidden sm:block">
                        {restaurant?.restaurantName || 'Your Restaurant'}
                    </p>

                    {/* Right: Language + My Profile + Logout */}
                    <div className="flex items-center gap-3">
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
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-lg transition"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ───── PAGE CONTENT ───── */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">

                {/* Page Title */}
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-8">Home Page</p>

                {/* ── ROW 1: Upload CSV  |  Manual Billing ── */}
                <div className="grid grid-cols-2 gap-5 mb-5">
                    <ModuleCard
                        icon={<UploadCloud className="w-7 h-7" />}
                        title="Upload CSV"
                        desc="Import menu, orders or sales data."
                        accent="text-blue-400"
                        glow="from-blue-600/20 to-transparent"
                        border="hover:border-blue-500/40"
                    />
                    <ModuleCard
                        icon={<Receipt className="w-7 h-7" />}
                        title="Manual Billing"
                        desc="Create dine-in & takeaway bills."
                        accent="text-emerald-400"
                        glow="from-emerald-600/20 to-transparent"
                        border="hover:border-emerald-500/40"
                    />
                </div>

                {/* ── ROW 2: AI Call (centered) ── */}
                <div className="flex justify-center mb-5">
                    <ModuleCard
                        icon={<Bot className="w-7 h-7" />}
                        title="AI Call"
                        desc="Voice assistant for hands-free restaurant ops."
                        accent="text-orange-400"
                        glow="from-orange-600/20 to-transparent"
                        border="hover:border-orange-500/40"
                        wide
                        featured
                    />
                </div>

                {/* ── ROW 3: Menu Doctor  |  Business Insights ── */}
                <div className="grid grid-cols-2 gap-5 mb-5">
                    <ModuleCard
                        icon={<BookOpen className="w-7 h-7" />}
                        title="Menu Doctor"
                        desc="AI-driven menu profitability analysis."
                        accent="text-purple-400"
                        glow="from-purple-600/20 to-transparent"
                        border="hover:border-purple-500/40"
                    />
                    <ModuleCard
                        icon={<BarChart2 className="w-7 h-7" />}
                        title="Business Insights"
                        desc="Deep analytics on sales and trends."
                        accent="text-cyan-400"
                        glow="from-cyan-600/20 to-transparent"
                        border="hover:border-cyan-500/40"
                    />
                </div>

                {/* ── ROW 4: Feedback Form (centered) ── */}
                <div className="flex justify-center">
                    <ModuleCard
                        icon={<MessageSquare className="w-7 h-7" />}
                        title="Feedback Form"
                        desc="Collect and review customer feedback."
                        accent="text-pink-400"
                        glow="from-pink-600/20 to-transparent"
                        border="hover:border-pink-500/40"
                        wide
                    />
                </div>
            </main>
        </div>
    );
}

function ModuleCard({ icon, title, desc, accent, glow, border, wide = false, featured = false }) {
    return (
        <button
            className={`relative group text-left p-6 rounded-2xl bg-gradient-to-br ${glow} border border-white/5 ${border} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 ${wide ? 'w-full max-w-sm' : 'w-full'} ${featured ? 'ring-1 ring-orange-500/30' : ''}`}
        >
            {featured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 bg-orange-500 text-white rounded-full shadow">
                    ✨ AI Powered
                </span>
            )}
            <div className={`${accent} mb-4`}>{icon}</div>
            <h3 className="text-base font-bold mb-1">{title}</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">{desc}</p>
        </button>
    );
}
