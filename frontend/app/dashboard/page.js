'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
    ChefHat, UserCircle, LogOut, Home,
    Sparkles, Store, User, FileText, Phone, Mail, Globe, ChevronDown,
    UploadCloud, Receipt, Bot, BookOpen, BarChart2, MessageSquare
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── i18n Translations ──────────────────────────────────────────
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
        homePage: 'હોમ પેજ', myProfile: 'મારી પ્રોફ઼ાઇલ', langLabel: 'ભાષા', logOut: 'લૉગ આઉટ',
        uploadTitle: 'CSV અપલોડ', uploadDesc: 'સ્પ્રેડશીટ પરથી મેનૂ, ઑર્ડર અથવા ડેટા આયાત કરો.', uploadBadge: 'ડેટા આયાત',
        billingTitle: 'મેન્યુઅલ બિલિંગ', billingDesc: 'ડાઇન-ઇન, ટેકઅવે અથવા ડિલિવરી માટે બિલ બનાવો.', billingBadge: 'POS',
        aiTitle: 'AI કૉલ', aiDesc: 'હેન્ડ્સ-ફ્રી ઑપરેશન માટે ઇન્ટેલિજન્ટ વૉઇસ આસિસ્ટન્ટ.', aiBadge: 'AI સંચાલિત', aiFeatured: '✨ ખાસ',
        menuTitle: 'મેનૂ ડૉક્ટર', menuDesc: 'AI-સંચાલિત મેનૂ વિશ્લેષણ નફાકારકતા વધારવા.', menuBadge: 'AI સંચાલિત',
        insightsTitle: 'વ્યવસાય સૂઝ', insightsDesc: 'વેચાણ રુઝાનો, ગ્રાહક આદતો અને પીક કલાકોનું ગહન વિશ્લેષણ.', insightsBadge: 'Analytics',
        feedbackTitle: 'ફીડબેક ફોર્મ', feedbackDesc: 'રીઅલ-ટાઇમ ગ્રાહક પ્રતિભાવ એકત્ર કરો અને સમીક્ષા કરો.', feedbackBadge: 'Engagement',
        detailsSuffix: 'ની વિગતો', resLabel: 'રેસ્ટોરન્ટ', ownerLabel: 'માલિક', gstLabel: 'GST', phoneLabel: 'ફોન', emailLabel: 'ઇમેઇલ',
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

    useEffect(() => {
        const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => { localStorage.removeItem('token'); router.push('/'); };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin shadow-lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50/50 via-slate-50 to-slate-100 text-slate-800 font-sans flex flex-col selection:bg-orange-500/20">

            {/* ── NAVBAR ─────────────────────────────────────────── */}
            <header className="h-16 bg-white/70 backdrop-blur-lg border-b border-slate-200/60 shadow-[0_4px_30px_rgba(0,0,0,0.02)] sticky top-0 z-50">
                <div className="h-full px-4 sm:px-6 flex items-center justify-between max-w-[1400px] mx-auto">

                    {/* Logo */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-[0_8px_16px_rgba(249,115,22,0.25)] border border-orange-400/50">
                            <ChefHat className="w-5 h-5 text-white drop-shadow-sm" />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">PetPooja</span>
                    </div>

                    {/* Restaurant name */}
                    <div className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
                        <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                        <span className="text-sm font-bold text-slate-700 tracking-tight">
                            {restaurant?.restaurantName || 'My Restaurant'}
                        </span>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-3 min-w-[140px] justify-end">

                        {/* Language dropdown */}
                        <div className="relative" ref={langRef}>
                            <button
                                onClick={() => setLangOpen((o) => !o)}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl transition-all duration-200 hover:shadow-md"
                            >
                                <Globe className="w-4 h-4 text-blue-500" />
                                {LANG_OPTIONS.find((l) => l.code === lang)?.label.split(' ')[0]}
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {langOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 overflow-hidden transform origin-top right-0">
                                    {LANG_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.code}
                                            onClick={() => { setLang(opt.code); setLangOpen(false); }}
                                            className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors flex items-center justify-between ${lang === opt.code ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                        >
                                            {opt.label}
                                            {lang === opt.code && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl transition-all duration-200 hover:shadow-md">
                            <UserCircle className="w-4 h-4 text-slate-400" /> {t.myProfile}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 shadow-sm rounded-xl transition-all duration-200 hover:shadow-md"
                        >
                            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{t.logOut}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── BODY ───────────────────────────────────────────── */}
            <div className="flex flex-1 max-w-[1400px] mx-auto w-full">

                {/* Sidebar */}
                <aside className="w-64 border-r border-slate-200/60 bg-white/40 backdrop-blur-md hidden lg:flex flex-col py-8 px-4 gap-2 sticky top-16 h-[calc(100vh-64px)]">
                    {[
                        { id: 'home', icon: <Home className="w-5 h-5" />, label: t.homePage },
                        { id: 'profile', icon: <UserCircle className="w-5 h-5" />, label: t.myProfile },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveNav(item.id)}
                            className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 w-full text-left group ${activeNav === item.id
                                    ? 'bg-white shadow-md shadow-slate-200/50 text-orange-600 border border-slate-100'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                                }`}
                        >
                            <div className={`${activeNav === item.id ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
                                {item.icon}
                            </div>
                            {item.label}
                        </button>
                    ))}
                </aside>

                {/* Main Content */}
                <main className="flex-1 px-4 sm:px-8 py-10 w-full overflow-y-auto">
                    <div className="max-w-4xl mx-auto flex flex-col gap-8">

                        {/* Header Area */}
                        <div className="flex flex-col mb-2">
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                                Good morning, {restaurant?.ownerName?.split(' ')[0] || 'Chef'} \ud83d\udc4b
                            </h1>
                            <p className="text-slate-500 font-medium text-sm">Here's what is happening with {restaurant?.restaurantName || 'your restaurant'} today.</p>
                        </div>

                        {/* ROW 1 — Upload CSV | Manual Billing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <PremiumCard
                                icon={<UploadCloud className="w-7 h-7" />}
                                title={t.uploadTitle} desc={t.uploadDesc} badge={t.uploadBadge}
                                colorFrom="from-blue-500" colorTo="to-cyan-400" bgLight="bg-blue-50/50" textAccent="text-blue-600"
                            />
                            <PremiumCard
                                icon={<Receipt className="w-7 h-7" />}
                                title={t.billingTitle} desc={t.billingDesc} badge={t.billingBadge}
                                colorFrom="from-emerald-500" colorTo="to-teal-400" bgLight="bg-emerald-50/50" textAccent="text-emerald-600"
                            />
                        </div>

                        {/* ROW 2 — AI Call (centered prominently) */}
                        <div className="flex justify-center w-full">
                            <div className="w-full md:w-3/4 lg:w-2/3">
                                <PremiumCard
                                    icon={<Bot className="w-8 h-8" />}
                                    title={t.aiTitle} desc={t.aiDesc} badge={t.aiBadge}
                                    colorFrom="from-orange-500" colorTo="to-red-500" bgLight="bg-orange-50/50" textAccent="text-orange-600"
                                    featured featuredLabel={t.aiFeatured}
                                />
                            </div>
                        </div>

                        {/* ROW 3 — Menu Doctor | Business Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <PremiumCard
                                icon={<BookOpen className="w-7 h-7" />}
                                title={t.menuTitle} desc={t.menuDesc} badge={t.menuBadge}
                                colorFrom="from-violet-500" colorTo="to-fuchsia-400" bgLight="bg-violet-50/50" textAccent="text-violet-600"
                            />
                            <PremiumCard
                                icon={<BarChart2 className="w-7 h-7" />}
                                title={t.insightsTitle} desc={t.insightsDesc} badge={t.insightsBadge}
                                colorFrom="from-sky-500" colorTo="to-indigo-400" bgLight="bg-sky-50/50" textAccent="text-sky-600"
                            />
                        </div>

                        {/* RESTAURANT DETAILS BAND */}
                        {restaurant && (
                            <div className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/40 p-6 md:p-8 mt-4 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-100/50 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Store className="w-4 h-4 text-slate-400" />
                                    {restaurant.restaurantName}{t.detailsSuffix}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 relative z-10">
                                    <DataChip icon={<Store className="w-4 h-4 text-orange-500" />} label={t.resLabel} value={restaurant.restaurantName} />
                                    <DataChip icon={<User className="w-4 h-4 text-blue-500" />} label={t.ownerLabel} value={restaurant.ownerName} />
                                    <DataChip icon={<FileText className="w-4 h-4 text-yellow-500" />} label={t.gstLabel} value={restaurant.gstNumber} />
                                    <DataChip icon={<Phone className="w-4 h-4 text-green-500" />} label={t.phoneLabel} value={restaurant.phone} />
                                    <DataChip icon={<Mail className="w-4 h-4 text-pink-500" />} label={t.emailLabel} value={restaurant.email} />
                                </div>
                            </div>
                        )}

                        {/* ROW 4 — Feedback Form (centered at bottom) */}
                        <div className="flex justify-center w-full mb-10">
                            <div className="w-full md:w-3/4 lg:w-2/3">
                                <PremiumCard
                                    icon={<MessageSquare className="w-7 h-7" />}
                                    title={t.feedbackTitle} desc={t.feedbackDesc} badge={t.feedbackBadge}
                                    colorFrom="from-pink-500" colorTo="to-rose-400" bgLight="bg-pink-50/50" textAccent="text-pink-600"
                                />
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

function PremiumCard({ icon, title, desc, badge, colorFrom, colorTo, bgLight, textAccent, featured = false, featuredLabel }) {
    return (
        <button
            className={`relative group text-left w-full p-6 md:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] overflow-hidden ${featured ? 'ring-2 ring-orange-400/50' : ''}`}
        >
            <div className={`absolute inset-0 ${bgLight} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

            {featured && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-bold px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-b-xl shadow-md whitespace-nowrap z-10">
                    {featuredLabel}
                </span>
            )}

            <div className="flex flex-col relative z-10">
                <div className="flex items-start justify-between mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorFrom} ${colorTo} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-slate-100 ${textAccent} border border-slate-200 group-hover:bg-white transition-colors`}>
                        {badge}
                    </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-800 mb-2 group-hover:text-slate-900">{title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed group-hover:text-slate-600 transition-colors">{desc}</p>
            </div>
        </button>
    );
}

function DataChip({ icon, label, value }) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
                {icon}
                <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-sm font-bold text-slate-700 truncate w-full" title={value}>{value}</p>
        </div>
    );
}
