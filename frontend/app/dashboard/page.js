'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
    ChefHat, UserCircle, LogOut, Home,
    Sparkles, Store, User, FileText, Phone, Mail, Globe, ChevronDown,
    LayoutDashboard, Receipt, Menu as MenuIcon, Settings
} from 'lucide-react';
import TRANSLATIONS from './translations';
import FeatureCard from '../../components/FeatureCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const LANG_OPTIONS = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
];

const CARDS = (t) => [
    { id: 'upload', emoji: '☁️', title: t.uploadTitle, desc: t.uploadDesc, badge: t.uploadBadge, tag: '#334155', tagText: '#e2e8f0' },
    { id: 'billing', emoji: '💸', title: t.billingTitle, desc: t.billingDesc, badge: t.billingBadge, tag: '#334155', tagText: '#e2e8f0' },
    { id: 'ai', emoji: '🤖', title: t.aiTitle, desc: t.aiDesc, badge: t.aiBadge, tag: '#ea580c', tagText: '#ffffff', featured: true, featuredLabel: t.aiFeatured },
    { id: 'menu', emoji: '📖', title: t.menuTitle, desc: t.menuDesc, badge: t.menuBadge, tag: '#334155', tagText: '#e2e8f0' },
    { id: 'insights', emoji: '📊', title: t.insightsTitle, desc: t.insightsDesc, badge: t.insightsBadge, tag: '#334155', tagText: '#e2e8f0' },
];

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState(null);
    const [activeNav, setActiveNav] = useState('overview');
    const [lang, setLang] = useState('en');
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef(null);

    const t = TRANSLATIONS[lang];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/'); return; }
        axios
            .get(`${API_URL}/restaurant/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => { setRestaurant(res.data.restaurant); setLoading(false); })
            .catch(() => setLoading(false));
    }, [router]);

    useEffect(() => {
        const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => { localStorage.removeItem('token'); router.push('/'); };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-700 border-t-[#FF6B2C] rounded-full animate-spin" />
            </div>
        );
    }

    const cards = CARDS(t);

    return (
        <div className="min-h-screen bg-[#0F172A] font-sans text-slate-300">
            {/* -- NAVBAR -- */}
            <header className="h-[72px] bg-[#111827] border-b border-slate-800 sticky top-0 z-50">
                <div className="h-full px-8 flex items-center justify-between">
                    {/* Logo (Left) */}
                    <div className="flex-1 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#FF6B2C] flex items-center justify-center shadow-lg shadow-[#FF6B2C]/20">
                            <ChefHat size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-extrabold text-white tracking-tight">PetPooja</span>
                    </div>

                    {/* Restaurant Name (Center) */}
                    <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-slate-800 border border-slate-700">
                        <Sparkles size={16} className="text-[#FF9F43]" />
                        <span className="text-sm font-bold text-[#FF9F43]">
                            {restaurant?.restaurantName || 'My Restaurant'}
                        </span>
                    </div>

                    {/* Right Controls */}
                    <div className="flex-1 flex items-center justify-end gap-3">
                        {/* Language Dropdown */}
                        <div className="relative" ref={langRef}>
                            <button
                                onClick={() => setLangOpen((o) => !o)}
                                className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <Globe size={14} className="text-blue-400" />
                                {LANG_OPTIONS.find((l) => l.code === lang)?.label.split(' ')[0]}
                                <ChevronDown size={14} className={`transition-transform duration-200 text-slate-500 ${langOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {langOpen && (
                                <div className="absolute right-0 top-[120%] w-[140px] bg-[#1E293B] border border-slate-700 rounded-2xl shadow-xl z-[100] overflow-hidden py-1.5">
                                    {LANG_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.code}
                                            onClick={() => { setLang(opt.code); setLangOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center justify-between hover:bg-[#273449] cursor-pointer ${lang === opt.code ? 'bg-[#273449] text-[#FF9F43]' : 'text-slate-300'}`}
                                        >
                                            {opt.label}
                                            {lang === opt.code && <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] block" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 transition-colors cursor-pointer">
                            <UserCircle size={14} className="text-slate-400" /> {t.myProfile}
                        </button>
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full hover:bg-red-500/20 transition-colors cursor-pointer">
                            <LogOut size={14} /> {t.logOut}
                        </button>
                    </div>
                </div>
            </header>

            {/* -- BODY -- */}
            <div className="flex min-h-[calc(100vh-72px)]">
                {/* Sidebar */}
                <aside className="w-[280px] bg-[#111827] border-r border-slate-800 p-8 flex flex-col gap-2">
                    {[
                        { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'Overview' },
                        { id: 'orders', icon: <Receipt size={18} />, label: 'Orders' },
                        { id: 'menu', icon: <MenuIcon size={18} />, label: 'Menu' },
                        { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveNav(item.id)}
                            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-base font-bold text-left transition-all duration-200 border border-transparent cursor-pointer ${activeNav === item.id ? 'bg-[#ea580c] text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-10 lg:p-14">
                    <div className="max-w-6xl mx-auto flex flex-col gap-10">
                        {/* Welcome Header */}
                        <div>
                            <h1 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight mb-2">
                                Restaurant Dashboard
                            </h1>
                            <p className="text-base text-[#CBD5F5] font-medium">
                                Here's what is happening with {restaurant?.restaurantName || 'your restaurant'} today.
                            </p>
                        </div>

                        {/* Grid Layout for Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FeatureCard icon={cards[0].emoji} title={cards[0].title} description={cards[0].desc} badge={cards[0].badge} />
                            <FeatureCard icon={cards[1].emoji} title={cards[1].title} description={cards[1].desc} badge={cards[1].badge} />
                            <FeatureCard icon={cards[2].emoji} title={cards[2].title} description={cards[2].desc} badge={cards[2].badge} featured={cards[2].featured} featuredLabel={cards[2].featuredLabel} />
                            <FeatureCard icon={cards[3].emoji} title={cards[3].title} description={cards[3].desc} badge={cards[3].badge} />
                            <FeatureCard icon={cards[4].emoji} title={cards[4].title} description={cards[4].desc} badge={cards[4].badge} />
                            {/* Feedback form as 6th card to balance grid */}
                            <FeatureCard icon="💬" title={t.feedbackTitle} description={t.feedbackDesc} badge={t.feedbackBadge} />
                        </div>

                        {/* Restaurant Data */}
                        {restaurant && (
                            <div className="mt-8">
                                <div className="p-8 bg-[#1E293B] border border-[#334155] rounded-3xl shadow-sm">
                                    <p className="text-[11px] font-bold text-[#CBD5F5] uppercase tracking-widest mb-6">
                                        {restaurant.restaurantName}{t.detailsSuffix}
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                        <DataChip icon={<Store size={15} className="text-[#FF6B2C]" />} label={t.resLabel} value={restaurant.restaurantName} />
                                        <DataChip icon={<User size={15} className="text-blue-500" />} label={t.ownerLabel} value={restaurant.ownerName} />
                                        <DataChip icon={<FileText size={15} className="text-yellow-500" />} label={t.gstLabel} value={restaurant.gstNumber} />
                                        <DataChip icon={<Phone size={15} className="text-emerald-500" />} label={t.phoneLabel} value={restaurant.phone} />
                                        <DataChip icon={<Mail size={15} className="text-pink-500" />} label={t.emailLabel} value={restaurant.email} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

function DataChip({ icon, label, value }) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm font-semibold text-[#CBD5F5] truncate">{value}</p>
            </div>
        </div>
    );
}
