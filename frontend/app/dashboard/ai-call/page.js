'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, PhoneCall } from 'lucide-react';
import VoiceOrderPanel from '@/components/VoiceOrderPanel';

export default function AICallPage() {
    const router = useRouter();

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

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 pt-12">
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-500 mb-6 shadow-sm border border-orange-200">
                        <PhoneCall size={28} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-[#0F172A] mb-3">Incoming Call Simulator</h2>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
                        Test your restaurant's AI Voice Ordering system. Speak clearly into your microphone in English, Hindi, or Hinglish to see live parsing and text normalization in action.
                    </p>
                </div>

                {/* The Component Container */}
                <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-200">
                    <VoiceOrderPanel />
                </div>

                {/* Information Card */}
                <div className="mt-12 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner">
                    <h3 className="font-bold text-slate-800 mb-2">How this works:</h3>
                    <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
                        <li>The system connects directly to your device's native browser microphone.</li>
                        <li>It streams the audio through the Web Speech API and returns high-speed transcriptions.</li>
                        <li>The <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-mono text-xs">normalizeSpeech()</code> function instantly strips out conversational filler like "please", "dena", and "mujhe".</li>
                        <li>The final normalized text is completely optimized and ready to be automatically sent to the LLM or POS API.</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
