'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Stethoscope, Loader2, RefreshCw } from 'lucide-react';
import PriceSuggestionCard from '@/components/menu-doctor/PriceSuggestionCard';
import FestivalOfferCard from '@/components/menu-doctor/FestivalOfferCard';
import MenuSuggestionCard from '@/components/menu-doctor/MenuSuggestionCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function MenuDoctorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState(null);
    const [error, setError] = useState(null);

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/');
                return;
            }

            const response = await axios.get(`${API_URL}/api/menu-doctor/recommendations`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRecommendations(response.data);
        } catch (err) {
            console.error('Failed to fetch Menu Doctor data:', err);
            const errMsg = err.response?.data?.error || err.message || 'Unknown error';
            setError(`Could not load insights. URL: ${API_URL} | Status: ${err.response?.status} | Error: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
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
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                                <Stethoscope size={22} className="text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-[#0F172A] leading-tight">Menu Doctor</h1>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">AI Insights & Optimization</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={fetchInsights}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 pt-10">
                {loading && !recommendations ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Analyzing menu performance & order history...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-center font-medium shadow-sm max-w-lg mx-auto mt-10">
                        {error}
                        <button
                            onClick={fetchInsights}
                            className="block mx-auto mt-4 px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition"
                        >
                            Try Again
                        </button>
                    </div>
                ) : recommendations ? (
                    <div className="flex flex-col gap-12">
                        {/* Section 1: Price Suggestions */}
                        {recommendations.priceSuggestions?.length > 0 && (
                            <section>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Price Optimization</h2>
                                    <p className="text-slate-500 mt-1">Smart pricing adjustments based on demand elasticity and margin health.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recommendations.priceSuggestions.map((item, i) => (
                                        <PriceSuggestionCard key={i} data={item} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Section 2: Festival Offers */}
                        {recommendations.offers?.length > 0 && (
                            <section>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Seasonal Combos & Offers</h2>
                                    <p className="text-slate-500 mt-1">Bundles recommended for the current season using high-margin favorites.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {recommendations.offers.map((offer, i) => (
                                        <FestivalOfferCard key={i} data={offer} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Section 3: Menu Improvements */}
                        {recommendations.menuSuggestions?.length > 0 && (
                            <section>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Menu Portfolio Health</h2>
                                    <p className="text-slate-500 mt-1">Identify your star performers and items that need attention.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recommendations.menuSuggestions.map((item, i) => (
                                        <MenuSuggestionCard key={i} data={item} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Fallback if all empty */}
                        {recommendations.priceSuggestions?.length === 0 &&
                            recommendations.offers?.length === 0 &&
                            recommendations.menuSuggestions?.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
                                    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Stethoscope size={36} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Not enough data yet</h3>
                                    <p className="text-slate-500 font-medium px-10">Menu Doctor needs more historical order data to generate accurate insights. Process more orders in the Manual Billing module to see recommendations.</p>
                                </div>
                            )}
                    </div>
                ) : null}
            </main>
        </div>
    );
}
