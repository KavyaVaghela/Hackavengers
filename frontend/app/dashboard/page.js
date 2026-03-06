'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
    ChefHat, UserCircle, LogOut, Home,
    Sparkles, Store, User, FileText, Phone, Mail, Globe, ChevronDown,
} from 'lucide-react';
import TRANSLATIONS from './translations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const LANG_OPTIONS = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: '\u0939\u093f\u0928\u094d\u0926\u0940 (Hindi)' },
    { code: 'gu', label: '\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0 (Gujarati)' },
];

// Card color configs to match the screenshot perfectly
const CARDS = (t) => [
    { id: 'upload', emoji: '\u2601\ufe0f', title: t.uploadTitle, desc: t.uploadDesc, badge: t.uploadBadge, icon: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', tag: '#DBEAFE', tagText: '#1D4ED8' },
    { id: 'billing', emoji: '\ud83d\udcb5', title: t.billingTitle, desc: t.billingDesc, badge: t.billingBadge, icon: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', tag: '#D1FAE5', tagText: '#065F46' },
    { id: 'ai', emoji: '\ud83e\udd16', title: t.aiTitle, desc: t.aiDesc, badge: t.aiBadge, icon: '#F97316', bg: '#FFF7ED', border: '#FED7AA', tag: '#FFEDD5', tagText: '#C2410C', featured: true, featuredLabel: t.aiFeatured },
    { id: 'menu', emoji: '\ud83d\udcd6', title: t.menuTitle, desc: t.menuDesc, badge: t.menuBadge, icon: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', tag: '#EDE9FE', tagText: '#5B21B6' },
    { id: 'insights', emoji: '\ud83d\udcca', title: t.insightsTitle, desc: t.insightsDesc, badge: t.insightsBadge, icon: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD', tag: '#E0F2FE', tagText: '#0369A1' },
];

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState(null);
    const [activeNav, setActiveNav] = useState('home');
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
            <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #FED7AA', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        );
    }

    const cards = CARDS(t);

    return (
        <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#4b5563' }}>

            {/* ── NAVBAR ── */}
            <header style={{ height: 72, background: '#FFFFFF', borderBottom: '1px solid #f3f4f6', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ height: '100%', padding: '0 32px', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>

                    {/* Logo (Left) */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(234, 88, 12, 0.2)' }}>
                            <ChefHat size={20} color="white" />
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#1f2937', letterSpacing: '-0.5px' }}>PetPooja</span>
                    </div>

                    {/* Restaurant Name (Center) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 9999, background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                        <Sparkles size={16} color="#ea580c" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#c2410c' }}>
                            {restaurant?.restaurantName || 'My Restaurant'}
                        </span>
                    </div>

                    {/* Right Controls */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>

                        {/* Language Dropdown */}
                        <div style={{ position: 'relative' }} ref={langRef}>
                            <button
                                onClick={() => setLangOpen((o) => !o)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#4b5563', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 9999, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <Globe size={14} color="#3B82F6" />
                                {LANG_OPTIONS.find((l) => l.code === lang)?.label.split(' ')[0]}
                                <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: langOpen ? 'rotate(180deg)' : 'none', color: '#9ca3af' }} />
                            </button>
                            {langOpen && (
                                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 140, background: 'white', border: '1px solid #f3f4f6', borderRadius: 16, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', zIndex: 100, overflow: 'hidden', padding: '6px 0' }}>
                                    {LANG_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.code}
                                            onClick={() => { setLang(opt.code); setLangOpen(false); }}
                                            style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, fontWeight: 500, background: lang === opt.code ? '#fff7ed' : 'transparent', color: lang === opt.code ? '#c2410c' : '#4b5563', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                        >
                                            {opt.label}
                                            {lang === opt.code && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ea580c', display: 'block' }} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#4b5563', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 9999, cursor: 'pointer' }}>
                            <UserCircle size={14} color="#6b7280" /> {t.myProfile}
                        </button>
                        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9999, cursor: 'pointer' }}>
                            <LogOut size={14} /> {t.logOut}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── BODY ── */}
            <div style={{ display: 'flex', minHeight: 'calc(100vh - 72px)' }}>

                {/* Sidebar */}
                <aside style={{ width: 280, background: '#FFFFFF', borderRight: '1px solid #f3f4f6', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        { id: 'home', icon: <Home size={18} />, label: t.homePage },
                        { id: 'profile', icon: <UserCircle size={18} />, label: t.myProfile },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveNav(item.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 16, fontSize: 15, fontWeight: 600, background: activeNav === item.id ? '#FFF7ED' : 'transparent', color: activeNav === item.id ? '#ea580c' : '#6b7280', border: '1px solid transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </aside>

                {/* Main Content */}
                <main style={{ flex: 1, padding: '56px 64px' }}>
                    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>

                        {/* Row 1: Upload CSV | Manual Billing */}
                        <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
                            <div style={{ flex: 1 }}><GlassCard card={cards[0]} /></div>
                            <div style={{ flex: 1 }}><GlassCard card={cards[1]} /></div>
                        </div>

                        {/* Row 2: AI Call centered */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '100%', maxWidth: 400 }}>
                                <GlassCard card={cards[2]} />
                            </div>
                        </div>

                        {/* Row 3: Menu Doctor | Business Insights */}
                        <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
                            <div style={{ flex: 1 }}><GlassCard card={cards[3]} /></div>
                            <div style={{ flex: 1 }}><GlassCard card={cards[4]} /></div>
                        </div>

                        {/* Restaurant Data */}
                        {restaurant && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                                <div style={{ width: '100%', padding: '24px 32px', background: '#FFFFFF', border: '1px solid #f3f4f6', borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 20 }}>
                                        {restaurant.restaurantName}{t.detailsSuffix}
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 24 }}>
                                        <DataChip icon={<Store size={15} color="#ea580c" />} label={t.resLabel} value={restaurant.restaurantName} />
                                        <DataChip icon={<User size={15} color="#3B82F6" />} label={t.ownerLabel} value={restaurant.ownerName} />
                                        <DataChip icon={<FileText size={15} color="#EAB308" />} label={t.gstLabel} value={restaurant.gstNumber} />
                                        <DataChip icon={<Phone size={15} color="#10B981" />} label={t.phoneLabel} value={restaurant.phone} />
                                        <DataChip icon={<Mail size={15} color="#EC4899" />} label={t.emailLabel} value={restaurant.email} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Row 4: Feedback Form centered */}
                        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 64 }}>
                            <div style={{ width: '100%', maxWidth: 400 }}>
                                <GlassCard card={{ emoji: '\ud83d\udcac', title: t.feedbackTitle, desc: t.feedbackDesc, badge: t.feedbackBadge, icon: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8', tag: '#FCE7F3', tagText: '#9D174D' }} />
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

function GlassCard({ card }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative', textAlign: 'left', width: '100%',
                padding: 32, borderRadius: 24,
                background: '#FFFFFF',
                border: '1px solid #f3f4f6',
                boxShadow: hovered ? '0 20px 40px rgba(0,0,0,0.06)' : '0 4px 20px rgba(0,0,0,0.03)',
                cursor: 'pointer', transition: 'all 0.3s ease',
                transform: hovered ? 'translateY(-4px)' : 'none',
            }}
        >
            {card.featured && (
                <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 700, padding: '4px 16px', background: '#ea580c', color: 'white', borderRadius: 24, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(234,88,12,0.3)' }}>
                    {card.featuredLabel}
                </span>
            )}
            <div style={{ fontSize: 36, marginBottom: 20 }}>{card.emoji}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', margin: 0 }}>{card.title}</h3>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 16, background: card.tag, color: card.tagText }}>{card.badge}</span>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
        </button>
    );
}

function DataChip({ icon, label, value }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
            <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
            </div>
        </div>
    );
}
