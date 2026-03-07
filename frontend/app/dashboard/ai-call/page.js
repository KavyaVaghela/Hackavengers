'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot } from 'lucide-react';
import VoiceAgentPanel from '@/components/VoiceAgentPanel';
import AIAnalyticsCard from '@/components/AIAnalyticsCard';

export default function AICallPage() {
    const router = useRouter();
    const [analyticsRefresh, setAnalyticsRefresh] = useState(0);

    const handleOrderPlaced = () => {
        // Trigger analytics card to refetch
        setAnalyticsRefresh(v => v + 1);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 h-[72px] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm">
                                <Bot size={22} className="text-[#FF6B2C]" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-[#0F172A] leading-tight">AI Voice Assistant</h1>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Automated Ordering</p>
                            </div>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 font-bold text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        System Online
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-8 space-y-8">

                {/* Analytics section */}
                <section className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
                    <AIAnalyticsCard refreshTrigger={analyticsRefresh} />
                </section>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-[#F8FAFC] px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Voice Ordering
                        </span>
                    </div>
                </div>

                {/* Voice agent */}
                <section className="flex justify-center">
                    <VoiceAgentPanel onOrderPlaced={handleOrderPlaced} />
                </section>

                {/* How it works */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <h3 className="font-bold text-slate-800 mb-3">How the AI Voice Copilot works:</h3>
                    <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-1.5">
                        <li>Press <strong>Start AI Call</strong> — the AI greets you with your restaurant name</li>
                        <li>Speak your order clearly, e.g. <em>"Ek veg burger aur ek coke"</em></li>
                        <li>The AI detects items from your menu using fuzzy matching</li>
                        <li>It confirms each item aloud and asks if you want more</li>
                        <li>When done, it suggests popular combos (upsells)</li>
                        <li>It reads the full order summary and asks for confirmation</li>
                        <li>Say <strong>"Yes"</strong> — order is saved to Supabase with <code className="bg-slate-200 px-1 rounded text-xs">order_type = ai_order</code></li>
                    </ol>
                </section>

            </main>
        </div>
    );
}
