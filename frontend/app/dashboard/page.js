'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
    ChefHat, UserCircle, LogOut, Home,
    Sparkles, Store, User, FileText, Phone, Mail, Globe, ChevronDown,
    LayoutDashboard, Receipt, Menu as MenuIcon, Settings, X, UploadCloud, Loader2
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
    { id: 'upload', emoji: '☁️', title: t.uploadTitle, desc: t.uploadDesc, badge: t.uploadBadge },
    { id: 'billing', emoji: '💸', title: t.billingTitle, desc: t.billingDesc, badge: t.billingBadge },
    { id: 'ai', emoji: '🤖', title: t.aiTitle, desc: t.aiDesc, badge: t.aiBadge, featured: true, featuredLabel: t.aiFeatured },
    { id: 'menu', emoji: '📖', title: t.menuTitle, desc: t.menuDesc, badge: t.menuBadge },
    { id: 'insights', emoji: '📊', title: t.insightsTitle, desc: t.insightsDesc, badge: t.insightsBadge },
];

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState(null);
    const [activeNav, setActiveNav] = useState('overview');
    const [lang, setLang] = useState('en');
    const [langOpen, setLangOpen] = useState(false);

    // CSV Upload State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [menuType, setMenuType] = useState('Veg');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success' | 'error', message: '' }

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

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        setIsUploading(true);
        setUploadStatus(null);

        const formData = new FormData();
        formData.append('csvFile', uploadFile);
        formData.append('menuType', menuType);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/api/menu/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setUploadStatus({ type: 'success', message: t.uploadSuccess });
            setUploadFile(null); // Reset after success
            setTimeout(() => {
                setIsUploadModalOpen(false);
                setUploadStatus(null);
            }, 3000);
        } catch (error) {
            console.error('Upload Error:', error);
            setUploadStatus({
                type: 'error',
                message: error.response?.data?.error || t.uploadError
            });
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-[#FF6B2C] rounded-full animate-spin" />
            </div>
        );
    }

    const cards = CARDS(t);

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
            {/* -- NAVBAR -- */}
            <header className="h-[72px] bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="h-full px-8 flex items-center justify-between">
                    {/* Logo (Left) */}
                    <div className="flex-1 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#FF6B2C] flex items-center justify-center shadow-md shadow-[#FF6B2C]/20">
                            <ChefHat size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-extrabold text-slate-900 tracking-tight">PetPooja</span>
                    </div>

                    {/* Restaurant Name (Center) */}
                    <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#FFF7ED] border border-[#FF9F43]/30">
                        <Sparkles size={16} className="text-[#FF6B2C]" />
                        <span className="text-sm font-bold text-[#FF6B2C]">
                            {restaurant?.restaurantName || 'My Restaurant'}
                        </span>
                    </div>

                    {/* Right Controls */}
                    <div className="flex-1 flex items-center justify-end gap-3">
                        {/* Language Dropdown */}
                        <div className="relative" ref={langRef}>
                            <button
                                onClick={() => setLangOpen((o) => !o)}
                                className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <Globe size={14} className="text-blue-500" />
                                {LANG_OPTIONS.find((l) => l.code === lang)?.label.split(' ')[0]}
                                <ChevronDown size={14} className={`transition-transform duration-200 text-slate-400 ${langOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {langOpen && (
                                <div className="absolute right-0 top-[120%] w-[140px] bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] overflow-hidden py-1.5">
                                    {LANG_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.code}
                                            onClick={() => { setLang(opt.code); setLangOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center justify-between hover:bg-slate-50 cursor-pointer ${lang === opt.code ? 'bg-[#FFF7ED] text-[#FF6B2C]' : 'text-slate-700'}`}
                                        >
                                            {opt.label}
                                            {lang === opt.code && <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] block" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors cursor-pointer shadow-sm">
                            <UserCircle size={14} className="text-slate-500" /> {t.myProfile}
                        </button>
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-full hover:bg-red-100 transition-colors cursor-pointer shadow-sm">
                            <LogOut size={14} /> {t.logOut}
                        </button>
                    </div>
                </div>
            </header>

            {/* -- BODY -- */}
            <div className="flex min-h-[calc(100vh-72px)]">
                {/* Sidebar */}
                <aside className="w-[280px] bg-[#F1F5F9] border-r border-slate-200 p-8 flex flex-col gap-2">
                    {[
                        { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'Overview' },
                        { id: 'orders', icon: <Receipt size={18} />, label: 'Orders' },
                        { id: 'menu', icon: <MenuIcon size={18} />, label: 'Menu' },
                        { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveNav(item.id)}
                            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-base font-bold text-left transition-all duration-200 border cursor-pointer ${activeNav === item.id
                                ? 'bg-white border-slate-200 text-[#FF6B2C] shadow-sm'
                                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                }`}
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
                            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mb-2">
                                Restaurant Dashboard
                            </h1>
                            <p className="text-base text-[#64748B] font-medium">
                                Here&apos;s what is happening with {restaurant?.restaurantName || 'your restaurant'} today.
                            </p>
                        </div>

                        {/* Grid Layout for Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FeatureCard
                                icon={cards[0].emoji}
                                title={cards[0].title}
                                description={cards[0].desc}
                                badge={cards[0].badge}
                                onClick={() => setIsUploadModalOpen(true)}
                            />
                            <FeatureCard
                                icon={cards[1].emoji}
                                title={cards[1].title}
                                description={cards[1].desc}
                                badge={cards[1].badge}
                                onClick={() => router.push('/pos')}
                            />
                            <FeatureCard icon={cards[2].emoji} title={cards[2].title} description={cards[2].desc} badge={cards[2].badge} featured={cards[2].featured} featuredLabel={cards[2].featuredLabel} />
                            <FeatureCard icon={cards[3].emoji} title={cards[3].title} description={cards[3].desc} badge={cards[3].badge} />
                            <FeatureCard icon={cards[4].emoji} title={cards[4].title} description={cards[4].desc} badge={cards[4].badge} />
                            {/* Feedback form as 6th card to balance grid */}
                            <FeatureCard icon="💬" title={t.feedbackTitle} description={t.feedbackDesc} badge={t.feedbackBadge} />
                        </div>

                        {/* Restaurant Data */}
                        {restaurant && (
                            <div className="mt-8">
                                <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                                        {restaurant.restaurantName}{t.detailsSuffix}
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                        <DataChip icon={<Store size={15} className="text-[#FF6B2C]" />} label={t.resLabel} value={restaurant.restaurantName} />
                                        <DataChip icon={<User size={15} className="text-blue-500" />} label={t.ownerLabel} value={restaurant.ownerName} />
                                        <DataChip icon={<FileText size={15} className="text-amber-500" />} label={t.gstLabel} value={restaurant.gstNumber} />
                                        <DataChip icon={<Phone size={15} className="text-emerald-500" />} label={t.phoneLabel} value={restaurant.phone} />
                                        <DataChip icon={<Mail size={15} className="text-pink-500" />} label={t.emailLabel} value={restaurant.email} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* -- CSV UPLOAD MODAL -- */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <UploadCloud size={20} className="text-[#FF6B2C]" />
                                {t.uploadModalTitle}
                            </h3>
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleUploadSubmit} className="p-6">

                            {/* Menu Type Selector */}
                            <div className="mb-6">
                                <label className="block text-[13px] font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                                    {t.selectMenuType}
                                </label>
                                <div className="relative">
                                    <select
                                        value={menuType}
                                        onChange={(e) => setMenuType(e.target.value)}
                                        className="w-full appearance-none bg-[#F8FAFC] border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/50 focus:border-[#FF6B2C] cursor-pointer"
                                    >
                                        <option value="Veg">Veg</option>
                                        <option value="Non-Veg">Non-Veg</option>
                                        <option value="Veg + Non-Veg">Veg + Non-Veg</option>
                                        <option value="Drinks">Drinks</option>
                                        <option value="Desserts">Desserts</option>
                                        <option value="Snacks">Snacks</option>
                                        <option value="Combos">Combos</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* File Upload Area */}
                            <div className="mb-6">
                                <label className="block text-[13px] font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                                    {t.uploadMenuFile}
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl hover:bg-slate-50 transition-colors relative">
                                    <div className="space-y-1 text-center">
                                        <UploadCloud className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        <div className="flex text-sm text-slate-600 justify-center">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#FF6B2C] hover:text-[#ea580c] focus-within:outline-none">
                                                <span>Choose CSV file</span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    accept=".csv"
                                                    className="sr-only"
                                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                                    required
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {uploadFile ? uploadFile.name : 'No file chosen'}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-2 text-[11px] text-slate-500 font-medium">
                                    {t.supportedFormatNote}
                                </p>
                            </div>

                            {/* Status Messages */}
                            {uploadStatus && (
                                <div className={`p-4 rounded-xl mb-6 text-sm font-semibold border ${uploadStatus.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                    {uploadStatus.message}
                                </div>
                            )}

                            {/* Modal Footer Actions */}
                            <div className="flex items-center gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="flex-1 px-4 py-3 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!uploadFile || isUploading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-[#FF6B2C] rounded-xl hover:bg-[#ea580c] transition-colors cursor-pointer shadow-md shadow-[#FF6B2C]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? (
                                        <><Loader2 size={16} className="animate-spin" /> {t.uploading}</>
                                    ) : (
                                        t.upload
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function DataChip({ icon, label, value }) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
            </div>
        </div>
    );
}
