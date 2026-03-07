'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { PhoneCall, TrendingUp, IndianRupee, Bot, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function StatCard({ icon, label, value, sub }) {
    return (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2 text-[#64748B] text-xs font-bold uppercase tracking-widest">
                {icon} {label}
            </div>
            <p className="text-3xl font-black text-[#0F172A]">{value}</p>
            {sub && <p className="text-xs text-[#64748B] font-medium">{sub}</p>}
        </div>
    );
}

/**
 * AIAnalyticsCard — shows AI voice order statistics
 */
export default function AIAnalyticsCard({ refreshTrigger }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/api/analytics/ai-orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data);
        } catch (e) {
            console.error('Analytics fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats, refreshTrigger]);

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Bot size={18} className="text-[#FF6B2C]" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">AI Order Analytics</h3>
                </div>
                <button onClick={fetchStats} className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100">
                    <RefreshCw size={14} />
                </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<PhoneCall size={13} />}
                    label="Today's AI Orders"
                    value={stats?.today?.count ?? 0}
                    sub="Orders placed via voice today"
                />
                <StatCard
                    icon={<IndianRupee size={13} />}
                    label="Today's Revenue"
                    value={`₹${(stats?.today?.revenue ?? 0).toFixed(0)}`}
                    sub="Revenue from AI orders today"
                />
                <StatCard
                    icon={<PhoneCall size={13} />}
                    label="This Month"
                    value={stats?.month?.count ?? 0}
                    sub="AI orders this month"
                />
                <StatCard
                    icon={<TrendingUp size={13} />}
                    label="Monthly Revenue"
                    value={`₹${(stats?.month?.revenue ?? 0).toFixed(0)}`}
                    sub="AI order revenue this month"
                />
            </div>
        </div>
    );
}
