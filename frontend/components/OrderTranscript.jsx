'use client';
import { Bot } from 'lucide-react';

/**
 * OrderTranscript — shows the raw + normalized transcript in real-time
 */
export default function OrderTranscript({ raw, normalized, isListening }) {
    if (!raw && !isListening) return null;

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                {isListening ? '🔴 Listening…' : 'Voice Transcript'}
            </p>

            {raw && (
                <div className="mb-3">
                    <p className="text-slate-800 font-medium leading-relaxed">{raw}</p>
                </div>
            )}

            {normalized && !isListening && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Normalized</p>
                    <span className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {normalized}
                    </span>
                </div>
            )}
        </div>
    );
}
