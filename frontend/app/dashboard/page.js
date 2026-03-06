'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
    ChefHat, UserCircle, LogOut, Home,
    Sparkles, Store, User, FileText, Phone, Mail, Globe, ChevronDown,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Translations ─────────────────────────────────────────────────
const T = {
    en: {
        homePage: 'Home Page', myProfile: 'My Profile', langLabel: 'Language', logOut: 'Log Out',
        uploadTitle: 'Upload CSV', uploadDesc: 'Import your menu, orders, or sales data from a spreadsheet.', uploadBadge: 'Data Import',
        billingTitle: 'Manual Billing', billingDesc: 'Create and manage bills for dine-in, takeaway, or delivery.', billingBadge: 'POS',
        aiTitle: 'AI Call', aiDesc: 'Intelligent voice assistant for hands-free restaurant operations.', aiBadge: 'AI Powered', aiFeatured: '✨ Featured',
        menuTitle: 'Menu Doctor', menuDesc: 'AI-powered menu analysis to boost item profitability.', menuBadge: 'AI Powered',
        insightsTitle: 'Business Insights', insightsDesc: 'Deep analytics on sales trends, customer habits, and peak hours.', insightsBadge: 'Analytics',
        feedbackTitle: 'Feedback Form', feedbackDesc: 'Collect and review real-time customer feedback and ratings.', feedbackBadge: 'Engagement',
        detailsSuffix: "'s Details", resLabel: 'Restaurant', ownerLabel: 'Owner', gstLabel: 'GST', phoneLabel: 'Phone', emailLabel: 'Email',
    },
    hi: {
        homePage: 'होम पेज', myProfile: 'मेरी प्रोफ़ाइल', langLabel: 'भाषा', logOut: 'लॉग आउट',
        uploadTitle: 'CSV अपलोड', uploadDesc: 'स्प्रेडशीट से मेनू, ऑर्डर या बिक्री डेटा आयात करें।', uploadBadge: 'डेटा आयात',
        billingTitle: 'मैनुअल बिलिंग', billingDesc: 'डाइन-इन, टेकअवे या डिलीवरी के लिए बिल बनाएं।', billingBadge: 'पीओएस',
        aiTitle: 'AI कॉल', aiDesc: 'हैंड्स-फ्री रेस्टोरेंट के लिए बुद्धिमान वॉयस असिस्टेंट।', aiBadge: 'AI संचालित', aiFeatured: '✨ विशेष',
        menuTitle: 'मेनू डॉक्टर', menuDesc: 'मेनू लाभप्रदता बढ़ाने के लिए AI-संचालित विश्लेषण।', menuBadge: 'AI संचालित',
        insightsTitle: 'व्यापार विश्लेषण', insightsDesc: 'बिक्री रुझानों और पीक घंटों का गहन विश्लेषण।', insightsBadge: 'विश्लेषण',
        feedbackTitle: 'फीडबैक फ़ॉर्म', feedbackDesc: 'रियल-टाइम ग्राहक प्रतिक्रिया एकत्र करें।', feedbackBadge: 'जुड़ाव',
        detailsSuffix: ' का विवरण', resLabel: 'रेस्टोरेंट', ownerLabel: 'मालिक', gstLabel: 'जीएसटी', phoneLabel: 'फ़ोन', emailLabel: 'ईमेल',
    },
    gu: {
        homePage: 'હોમ પેજ', myProfile: 'મારી પ્રોફ઼ाइल', langLabel: 'ભાષા', logOut: 'લૉગ આઉટ',
        uploadTitle: 'CSV અપલોડ', uploadDesc: 'સ્પ્રેડશીટ પરથી મેનૂ, ઑર્ડર અથવા ડેટા આયાત કરો.', uploadBadge: 'ડેટા આયાત',
        billingTitle: 'મેન્યુઅલ બિલિંગ', billingDesc: 'ડાઇન-ઇન, ટેકઅવે અથવા ડિલિવ\u200bરી માટે બિલ બનાવો.', billingBadge: 'POS',
        aiTitle: 'AI \u0a95\u0a4b\u0ab2', aiDesc: '\u0ab9\u0ac7\u0aa8\u0acd\u0aa1\u0acd\u0ab8-\u0aab\u0acd\u0ab0\u0ac0 \u0a93\u0aaa\u200b\u0ab0\u0ac7\u0ab6\u0aa8 \u0aae\u0abe\u0a9f\u0ac7 \u0a87\u0aa8\u0acd\u0a9f\u0ac7\u0ab2\u0abf\u200b\u0a9c\u0aa8\u0acd\u0a9f \u0ab5\u0acb\u0a87\u0ab8 \u0a86\u0ab8\u200b\u0abf\u0ab8\u0acd\u0a9f\u0aa8\u0acd\u0a9f.', aiBadge: 'AI \u0ab8\u0a82\u0a9a', aiFeatured: '\u2728 \u0a96\u0abe\u0ab8',
        menuTitle: '\u0aae\u0ac7\u0aa8\u0ac2 \u0aa1\u0acb\u0a95\u0acd\u0a9f\u0ab0', menuDesc: 'AI-\u0ab8\u0a82\u0a9a\u0abe\u0ab2\u0abf\u0aa4 \u0aae\u0ac7\u0aa8\u0ac2 \u0ab5\u0abf\u200b\u0ab6\u0acd\u0ab2\u200b\u0ac7\u0ab7\u0aa3.', menuBadge: 'AI \u0ab8\u0a82\u0a9a',
        insightsTitle: '\u0ab5\u0acd\u0aaf\u200b\u0ab5\u200b\u0ab8\u200b\u0abe\u0aaf \u0a86\u200b\u0a82\u0aa4\u200b\u0ab0\u200b\u0aa6\u200b\u0eb4\u0ab7\u200b\u0acd\u0a9f\u200b\u0abf', insightsDesc: '\u0ab5\u0ac7\u0a9a\u0abe\u0aa3 \u0a85\u0aa8\u0ac7 \u0aaa\u0ac0\u0a95 \u0a95\u0ab2\u0abe\u0a95\u0acb\u0aa8\u0ac1\u0a82 \u0ab5\u0abf\u0ab6\u0acd\u0ab2\u0ac7\u0ab7\u0aa3.', insightsBadge: 'Analytics',
        feedbackTitle: '\u0aab\u0ac0\u0aa1\u0aac\u0ac5\u0a95 \u0aab\u0acb\u0ab0\u0acd\u0aae', feedbackDesc: '\u0ab0\u0ac0\u0a85\u200b\u0ab2-\u0a9f\u0abe\u0a87\u0aae \u0a97\u0acd\u0ab0\u0abe\u0ab9\u0a95 \u0aaa\u0acd\u0ab0\u0aa4\u0abf\u0aad\u0abe\u0ab5 \u0a8f\u0a95\u0aa4\u0acd\u0ab0 \u0a95\u0ab0\u0acb.', feedbackBadge: 'Engagement',
        detailsSuffix: '\u0aa8\u0ac1\u0a82 \u0ab5\u0abf\u0ab5\u0ab0\u0aa3', resLabel: '\u0ab0\u0ac7\u0ab8\u0acd\u0a9f\u0acb\u0ab0\u0aa8\u0acd\u0a9f', ownerLabel: '\u0aae\u0abe\u0ab2\u0abf\u0a95', gstLabel: 'GST', phoneLabel: '\u0aab\u0acb\u0aa8', emailLabel: '\u0a87\u0aae\u0ac7\u0a87\u0ab2',
    },
};

const LANG_OPTIONS = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
];

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState(null);
    const [activeNav, setActiveNav] = useState('home');
    const [lang, setLang] = useState('en');
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef(null);
    const t = T[lang];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/'); return; }
        axios
            .get(`${API_URL}/restaurant/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => { setRestaurant(res.data.restaurant); setLoading(false); })
            .catch(() => setLoading(false));
    }, [router]);

    // Close language dropdown on outside click
    useEffect(() => {
        const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => { localStorage.removeItem('token'); router.push('/'); };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col">

            {/* ── NAVBAR ─────────────────────────────────────────── */}
            <header className="h-16 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
                <div className="h-full px-6 flex items-center justify-between max-w-screen-xl mx-auto">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5 min-w-[140px]">
                        <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-[0_0_14px_rgba(249,115,22,0.35)]">
                            <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-extrabold tracking-tight text-slate-900">PetPooja</span>
                    </div>

                    {/* Restaurant name */}
                    <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-orange-50 border border-orange-200">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span className="text-base font-bold text-orange-700 tracking-tight">
                            {restaurant?.restaurantName || 'My Restaurant'}
                        </span>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2 min-w-[140px] justify-end">

                        {/* Language dropdown */}
                        <div className="relative" ref={langRef}>
                            <button
                                onClick={() => setLangOpen((o) => !o)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition"
                            >
                                <Globe className="w-3.5 h-3.5 text-blue-500" />
                                {LANG_OPTIONS.find((l) => l.code === lang)?.label.split(' ')[0]}
                                <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {langOpen && (
                                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                                    {LANG_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.code}
                                            onClick={() => { setLang(opt.code); setLangOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition flex items-center justify-between ${lang === opt.code ? 'bg-orange-50 text-orange-600' : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            {opt.label}
                                            {lang === opt.code && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition">
                            <UserCircle className="w-3.5 h-3.5" /> {t.myProfile}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                        >
                            <LogOut className="w-3.5 h-3.5" /> {t.logOut}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── BODY ───────────────────────────────────────────── */}
            <div className="flex flex-1 max-w-screen-xl mx-auto w-full">

                {/* Sidebar */}
                <aside className="w-52 border-r border-slate-200 bg-white hidden md:flex flex-col py-6 px-3 gap-1 sticky top-16 h-[calc(100vh-64px)]">
                    {[
                        { id: 'home', icon: <Home className="w-4 h-4" />, label: t.homePage },
                        { id: 'profile', icon: <UserCircle className="w-4 h-4" />, label: t.myProfile },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveNav(item.id)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition w-full text-left ${activeNav === item.id
                                    ? 'bg-orange-100 text-orange-600 border border-orange-200'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                }`}
                        >
                            {item.icon}{item.label}
                        </button>
                    ))}
                </aside>

                {/* Main Content */}
                <main className="flex-1 px-8 py-10">
                    <div className="max-w-2xl mx-auto flex flex-col gap-5">

                        {/* ROW 1 — Upload CSV | Manual Billing */}
                        <div className="grid grid-cols-2 gap-5">
                            <Card emoji="☁️" title={t.uploadTitle} desc={t.uploadDesc} badge={t.uploadBadge}
                                accent="text-blue-600" bg="bg-blue-50" border="border-blue-200" glow="hover:shadow-blue-100" />
                            <Card emoji="💵" title={t.billingTitle} desc={t.billingDesc} badge={t.billingBadge}
                                accent="text-emerald-600" bg="bg-emerald-50" border="border-emerald-200" glow="hover:shadow-emerald-100" />
                        </div>

                        {/* ROW 2 — AI Call (centered) */}
                        <div className="flex justify-center">
                            <div className="w-full max-w-xs">
                                <Card emoji="🤖" title={t.aiTitle} desc={t.aiDesc} badge={t.aiBadge}
                                    accent="text-orange-600" bg="bg-orange-50" border="border-orange-200" glow="hover:shadow-orange-100"
                                    featured featuredLabel={t.aiFeatured} />
                            </div>
                        </div>

                        {/* ROW 3 — Menu Doctor | Business Insights */}
                        <div className="grid grid-cols-2 gap-5">
                            <Card emoji="📖" title={t.menuTitle} desc={t.menuDesc} badge={t.menuBadge}
                                accent="text-purple-600" bg="bg-purple-50" border="border-purple-200" glow="hover:shadow-purple-100" />
                            <Card emoji="📊" title={t.insightsTitle} desc={t.insightsDesc} badge={t.insightsBadge}
                                accent="text-cyan-600" bg="bg-cyan-50" border="border-cyan-200" glow="hover:shadow-cyan-100" />
                        </div>

                        {/* RESTAURANT DETAILS */}
                        {restaurant && (
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    {restaurant.restaurantName}{t.detailsSuffix}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <DataChip icon={<Store className="w-3.5 h-3.5 text-orange-500" />} label={t.resLabel} value={restaurant.restaurantName} />
                                    <DataChip icon={<User className="w-3.5 h-3.5 text-blue-500" />} label={t.ownerLabel} value={restaurant.ownerName} />
                                    <DataChip icon={<FileText className="w-3.5 h-3.5 text-yellow-500" />} label={t.gstLabel} value={restaurant.gstNumber} />
                                    <DataChip icon={<Phone className="w-3.5 h-3.5 text-green-500" />} label={t.phoneLabel} value={restaurant.phone} />
                                    <DataChip icon={<Mail className="w-3.5 h-3.5 text-pink-500" />} label={t.emailLabel} value={restaurant.email} />
                                </div>
                            </div>
                        )}

                        {/* ROW 4 — Feedback Form (centered) */}
                        <div className="flex justify-center">
                            <div className="w-full max-w-xs">
                                <Card emoji="💬" title={t.feedbackTitle} desc={t.feedbackDesc} badge={t.feedbackBadge}
                                    accent="text-pink-600" bg="bg-pink-50" border="border-pink-200" glow="hover:shadow-pink-100" />
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

function Card({ emoji, title, desc, badge, accent, bg, border, glow, featured = false, featuredLabel }) {
    return (
        <button
            className={`relative group text-left w-full p-5 rounded-2xl ${bg} border ${border} shadow-sm ${glow} hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 ${featured ? `ring-2 ring-orange-300` : ''}`}
        >
            {featured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 bg-orange-500 text-white rounded-full shadow whitespace-nowrap">
                    {featuredLabel}
                </span>
            )}
            <div className="text-3xl mb-3">{emoji}</div>
            <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-sm font-bold ${accent}`}>{title}</h3>
                <span className={`text-[10px] font-semibold border border-current px-2 py-0.5 rounded-full ${accent}`}>
                    {badge}
                </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
        </button>
    );
}

function DataChip({ icon, label, value }) {
    return (
        <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div className="overflow-hidden">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
            </div>
        </div>
    );
}
