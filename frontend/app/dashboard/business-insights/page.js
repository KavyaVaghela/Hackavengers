'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, LineChart, Loader2, RefreshCw } from 'lucide-react';

// Components
import RevenueChart from '@/components/business-insights/RevenueChart';
import TopItemsChart from '@/components/business-insights/TopItemsChart';
import MenuEngineeringTable from '@/components/business-insights/MenuEngineeringTable';
import ComboSuggestionCard from '@/components/business-insights/ComboSuggestionCard';
import SalesForecastCard from '@/components/business-insights/SalesForecastCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function BusinessInsightsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data States
    const [dailyRevenue, setDailyRevenue] = useState([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [menuClassification, setMenuClassification] = useState(null);
    const [comboRecommendations, setComboRecommendations] = useState([]);
    const [salesForecast, setSalesForecast] = useState(null);

    const fetchAllInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/');
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            // Fetch all 6 endpoints in parallel for performance
            const [
                dailyRes,
                monthlyRes,
                topRes,
                menuRes,
                comboRes,
                forecastRes
            ] = await Promise.all([
                axios.get(`${API_URL}/api/insights/revenue-daily`, { headers }),
                axios.get(`${API_URL}/api/insights/revenue-monthly`, { headers }),
                axios.get(`${API_URL}/api/insights/top-items`, { headers }),
                axios.get(`${API_URL}/api/insights/menu-classification`, { headers }),
                axios.get(`${API_URL}/api/insights/combo-recommendations`, { headers }),
                axios.get(`${API_URL}/api/insights/sales-forecast`, { headers }),
            ]);

            setDailyRevenue(dailyRes.data);
            setMonthlyRevenue(monthlyRes.data);
            setTopItems(topRes.data);
            setMenuClassification(menuRes.data);
            setComboRecommendations(comboRes.data);
            setSalesForecast(forecastRes.data);

        } catch (err) {
            console.error('Failed to fetch Business Insights:', err);
            const errMsg = err.response?.data?.error || err.message || 'Unknown error';
            setError(`Could not load analytics. URL: ${API_URL} | Status: ${err.response?.status} | Error: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllInsights();
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                                <LineChart size={22} className="text-emerald-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-[#0F172A] leading-tight">Business Insights</h1>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Analytics & Forecasting</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={fetchAllInsights}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh Data
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-6 pt-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Crunching numbers and training forecast models...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-center font-medium shadow-sm max-w-lg mx-auto mt-10">
                        {error}
                        <button
                            onClick={fetchAllInsights}
                            className="block mx-auto mt-4 px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {/* Top Row: AI Forecast & Key Metrics */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 border-emerald-500">
                                <SalesForecastCard data={salesForecast} />
                            </div>
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <RevenueChart data={dailyRevenue} title="Daily Revenue" />
                                <RevenueChart data={monthlyRevenue} title="Monthly Revenue" />
                            </div>
                        </div>

                        {/* Middle Row: Top Items & Combos */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <TopItemsChart data={topItems} />
                            </div>
                            <div className="lg:col-span-1">
                                <ComboSuggestionCard data={comboRecommendations} />
                            </div>
                        </div>

                        {/* Bottom Row: Menu Engineering */}
                        <div>
                            <MenuEngineeringTable data={menuClassification} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
