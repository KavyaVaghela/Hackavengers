'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Mic, Square, Loader2, Volume2, ShoppingBag, Sparkles, CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Pure utility functions (no React state access) ───────────────────────────

const FILLER_WORDS = ['please', 'dena', 'mujhe', 'aur', 'de', 'chahiye'];

const normalizeSpeech = (text) => {
    if (!text) return '';
    let normalized = text.toLowerCase();
    normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    const fillerRegex = new RegExp(`\\b(${FILLER_WORDS.join('|')})\\b`, 'gi');
    normalized = normalized.replace(fillerRegex, ' ');
    return normalized.replace(/\s{2,}/g, ' ').trim();
};

const WORD_TO_NUMBER = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    ek: 1, do: 2, teen: 3, char: 4, paanch: 5,
    chhe: 6, saat: 7, aath: 8, nau: 9, das: 10,
};

const extractQuantity = (transcript, itemName) => {
    if (!transcript) return 1;
    const words = transcript.split(' ');
    const firstWord = itemName.toLowerCase().split(' ')[0];
    const idx = words.findIndex(w => w.includes(firstWord) || firstWord.includes(w));
    if (idx > 0) {
        for (let i = idx - 1; i >= Math.max(0, idx - 2); i--) {
            const w = words[i];
            if (!isNaN(parseInt(w))) return parseInt(w);
            if (WORD_TO_NUMBER[w]) return WORD_TO_NUMBER[w];
        }
    }
    return 1;
};

const detectModifiers = (transcript) => {
    const modifiers = { size: null, spice: null, removals: [] };
    if (!transcript) return modifiers;
    const t = ` ${transcript} `;
    if (t.includes(' large ')) modifiers.size = 'large';
    else if (t.includes(' medium ')) modifiers.size = 'medium';
    else if (t.includes(' small ')) modifiers.size = 'small';
    if (t.includes(' extra spicy ') || t.includes(' bahut spicy ') || t.includes(' jyada spicy ')) modifiers.spice = 'extra spicy';
    else if (t.includes(' spicy ') || t.includes(' teekha ')) modifiers.spice = 'spicy';
    else if (t.includes(' mild ') || t.includes(' kam spicy ') || t.includes(' no spicy ')) modifiers.spice = 'mild';
    const removalRegex = /\b(no|bina|without)\s+(\w+)\b/gi;
    let match;
    while ((match = removalRegex.exec(transcript)) !== null) {
        modifiers.removals.push(match[2].toLowerCase());
    }
    return modifiers;
};

const matchMenuItemsUtil = (text, menu) => {
    if (!text || !menu || menu.length === 0) return [];
    const detected = [];
    menu.forEach(item => {
        const itemLower = item.item_name.toLowerCase();
        // Simple word-overlap + partial string match (no fuzzball to avoid build issues)
        const itemWords = itemLower.split(' ');
        const transcriptWords = text.split(' ');
        const matchCount = itemWords.filter(w => w.length > 2 && transcriptWords.some(tw => tw.includes(w) || w.includes(tw))).length;
        const matchRatio = matchCount / itemWords.length;
        if (matchRatio >= 0.6 || text.includes(itemLower)) {
            if (!detected.find(d => d.id === item.id)) {
                const quantity = extractQuantity(text, item.item_name);
                detected.push({ ...item, quantity });
            }
        }
    });
    return detected;
};

const suggestUpsellUtil = (orderItems, rules) => {
    if (!orderItems.length || !rules.length) return null;
    for (const rule of rules) {
        const hasTrigger = orderItems.some(i => i.item_name.toLowerCase().includes(rule.trigger_item.toLowerCase()));
        const hasSuggestion = orderItems.some(i => i.item_name.toLowerCase().includes(rule.suggest_item.toLowerCase()));
        if (hasTrigger && !hasSuggestion) return rule.suggest_item;
    }
    return null;
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function VoiceOrderPanel() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [normalizedTranscript, setNormalizedTranscript] = useState('');
    const [matchedItems, setMatchedItems] = useState([]);
    const [detectedModifiers, setDetectedModifiers] = useState({ size: null, spice: null, removals: [] });
    const [upsellSuggestion, setUpsellSuggestion] = useState(null);
    const [orderStatus, setOrderStatus] = useState(null); // null | 'loading' | 'success' | 'error'
    const [error, setError] = useState(null);

    // Refs to avoid stale closures inside SpeechRecognition callbacks
    const recognitionRef = useRef(null);
    const menuListRef = useRef([]);
    const upsellRulesRef = useRef([]);
    const [menuLoaded, setMenuLoaded] = useState(false);
    const [menuError, setMenuError] = useState(false);

    // Fetch menu + upsell rules — also called before each recording to ensure freshness
    const fetchMenuData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const [menuRes, upsellRes] = await Promise.all([
                axios.get(`${API_URL}/api/menu`, { headers: { Authorization: `Bearer ${token}` } })
                    .catch(e => { console.warn('Menu fetch failed:', e.message); return { data: [] }; }),
                axios.get(`${API_URL}/api/upsells`, { headers: { Authorization: `Bearer ${token}` } })
                    .catch(() => ({ data: [] }))
            ]);
            const items = menuRes.data || [];
            menuListRef.current = items;
            upsellRulesRef.current = upsellRes.data || [];
            setMenuLoaded(items.length > 0);
            setMenuError(items.length === 0);
        } catch (err) {
            console.error('Failed to fetch AI call data:', err);
            setMenuError(true);
        }
    }, []);

    useEffect(() => { fetchMenuData(); }, [fetchMenuData]);


    // ── SpeechRecognition setup — runs once on mount ──
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Your browser does not support the Web Speech API. Please use Google Chrome.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => { setIsListening(true); setError(null); };

        recognition.onresult = (event) => {
            let raw = '';
            for (let i = 0; i < event.results.length; i++) {
                raw += event.results[i][0].transcript;
            }
            setTranscript(raw);

            const normalized = normalizeSpeech(raw);
            setNormalizedTranscript(normalized);

            // Use refs so we always get the latest menu/upsell data
            const matched = matchMenuItemsUtil(normalized, menuListRef.current);
            setMatchedItems(matched);
            setUpsellSuggestion(suggestUpsellUtil(matched, upsellRulesRef.current));
            setDetectedModifiers(detectModifiers(normalized));
        };

        recognition.onerror = (event) => {
            setError(`Microphone error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => { setIsListening(false); };

        recognitionRef.current = recognition;
        return () => recognitionRef.current?.stop();
    }, []);

    // ── Controls ──
    const startListening = useCallback(async () => {
        // Re-fetch menu if it failed or hasn't loaded yet
        if (!menuLoaded) {
            await fetchMenuData();
        }
        setTranscript('');
        setNormalizedTranscript('');
        setMatchedItems([]);
        setUpsellSuggestion(null);
        setDetectedModifiers({ size: null, spice: null, removals: [] });
        setOrderStatus(null);
        setError(null);
        try { recognitionRef.current?.start(); } catch { /* already started */ }
    }, [menuLoaded, fetchMenuData]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    const calculateTotal = useCallback(() =>
        matchedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [matchedItems]);

    const handleCancelOrder = useCallback(() => {
        setTranscript('');
        setMatchedItems([]);
        setUpsellSuggestion(null);
        setDetectedModifiers({ size: null, spice: null, removals: [] });
        setOrderStatus(null);
    }, []);

    const handleConfirmOrder = useCallback(async () => {
        if (!matchedItems.length) return;
        setOrderStatus('loading');
        try {
            const token = localStorage.getItem('token');
            const payload = {
                order_type: 'voice',
                items: matchedItems.map(item => ({
                    id: item.id,
                    name: item.item_name,
                    quantity: item.quantity,
                    price: item.price
                })),
                total_amount: matchedItems.reduce((s, i) => s + i.price * i.quantity, 0),
                created_at: new Date().toISOString()
            };
            await axios.post(`${API_URL}/api/orders/voice`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrderStatus('success');
            setTimeout(() => {
                setTranscript('');
                setMatchedItems([]);
                setUpsellSuggestion(null);
                setDetectedModifiers({ size: null, spice: null, removals: [] });
                setOrderStatus(null);
            }, 3000);
        } catch (err) {
            console.error('Voice order failed:', err);
            setOrderStatus('error');
            setTimeout(() => setOrderStatus(null), 3000);
        }
    }, [matchedItems]);

    const addUpsellToCart = useCallback((itemName) => {
        const found = menuListRef.current.find(i =>
            i.item_name.toLowerCase().includes(itemName.toLowerCase())
        );
        if (found) {
            setMatchedItems(prev => [...prev, { ...found, quantity: 1 }]);
            setUpsellSuggestion(null);
        }
    }, []);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                    <Volume2 size={20} className="text-orange-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Voice Ordering</h2>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">English • Hindi • Hinglish</p>
                </div>
                {isListening && (
                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-full text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Listening…
                    </div>
                )}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>
            )}

            {/* Menu Load Warning */}
            {menuError && !error && (
                <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium border border-amber-200 flex items-center gap-2">
                    ⚠ Menu data could not be loaded from the server. Item detection may not work. Tap &quot;Start Voice Order&quot; to retry.
                </div>
            )}

            {/* Success Banner */}
            {orderStatus === 'success' && (
                <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-200 flex items-center gap-2">
                    <CheckCircle size={18} /> Order Successfully Placed! Kitchen notified.
                </div>
            )}
            {orderStatus === 'error' && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-200 flex items-center gap-2">
                    <XCircle size={18} /> Order failed. Please try again.
                </div>
            )}

            <div className="flex flex-col gap-6">

                {/* ── Transcript Box ── */}
                <div className="bg-slate-50 rounded-2xl p-6 min-h-[160px] border border-slate-200 shadow-inner relative">
                    {!transcript && !isListening && (
                        <p className="text-slate-400 italic font-medium absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-6">
                            Click &quot;Start Voice Order&quot; and speak your order…
                        </p>
                    )}

                    {transcript && (
                        <div className="flex flex-col gap-5">

                            {/* Raw */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Raw Transcript</p>
                                <p className="text-slate-800 text-base leading-relaxed font-medium">{transcript}</p>
                            </div>

                            {/* Normalized */}
                            {normalizedTranscript && (
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Normalized</p>
                                    <p className="text-emerald-700 text-base font-semibold bg-emerald-50 inline-block px-3 py-1 rounded-lg border border-emerald-100">
                                        {normalizedTranscript}
                                    </p>
                                </div>
                            )}

                            {/* Detected Items */}
                            {matchedItems.length > 0 && (
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <ShoppingBag size={13} /> Detected Items
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {matchedItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 border border-blue-100 bg-blue-50/50 rounded-xl">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{item.item_name} &times; {item.quantity}</span>
                                                    <span className="text-xs font-semibold text-slate-500">{item.category}</span>
                                                </div>
                                                <span className="font-extrabold text-[#FF6B2C]">&#8377;{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Modifiers */}
                            {(detectedModifiers.size || detectedModifiers.spice || detectedModifiers.removals.length > 0) && (
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3">Order Modifiers</p>
                                    <div className="flex flex-wrap gap-2">
                                        {detectedModifiers.size && (
                                            <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-[13px] font-bold border border-purple-100">
                                                Size: <span className="capitalize">{detectedModifiers.size}</span>
                                            </span>
                                        )}
                                        {detectedModifiers.spice && (
                                            <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-[13px] font-bold border border-red-100">
                                                Spice: <span className="capitalize">{detectedModifiers.spice}</span>
                                            </span>
                                        )}
                                        {detectedModifiers.removals.map((r, i) => (
                                            <span key={i} className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full text-[13px] font-bold border border-slate-200">
                                                No <span className="capitalize">{r}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upsell */}
                            {upsellSuggestion && (
                                <div className="pt-4 border-t border-slate-100 flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                        <Sparkles size={15} className="text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-0.5">Recommended Add-on</p>
                                        <p className="text-sm text-amber-900 font-medium">
                                            Add <span className="font-extrabold">{upsellSuggestion}</span> to your order?
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => addUpsellToCart(upsellSuggestion)}
                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            {/* ── Order Summary (shown when NOT listening) ── */}
                            {matchedItems.length > 0 && !isListening && orderStatus !== 'success' && (
                                <div className="mt-2 pt-6 border-t-2 border-dashed border-slate-200">
                                    <h3 className="font-extrabold text-[#0F172A] mb-4 text-center text-lg">Order Summary</h3>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 mb-4">
                                        {matchedItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                                                <span className="font-semibold text-slate-700">{item.quantity} &times; {item.item_name}</span>
                                                <span className="font-bold text-slate-800">&#8377;{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-base pt-2 mt-2 border-t border-slate-300">
                                            <span className="font-extrabold text-slate-900">Total</span>
                                            <span className="font-black text-[#FF6B2C]">&#8377;{calculateTotal()}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleCancelOrder}
                                            disabled={orderStatus === 'loading'}
                                            className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            Cancel Order
                                        </button>
                                        <button
                                            onClick={handleConfirmOrder}
                                            disabled={orderStatus === 'loading'}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${orderStatus === 'error'
                                                ? 'bg-red-100 text-red-700 border border-red-200'
                                                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                                                }`}
                                        >
                                            {orderStatus === 'loading' && <Loader2 size={16} className="animate-spin" />}
                                            {orderStatus === 'error' ? '✕ Failed – Retry?' : 'Confirm Order'}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* ── Mic Controls ── */}
                <div className="flex items-center justify-center gap-4">
                    {!isListening ? (
                        <button
                            onClick={startListening}
                            disabled={!!error}
                            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#FF6B2C] to-[#FF9F43] hover:from-[#ea580c] hover:to-[#ea580c] text-white rounded-full font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                        >
                            <Mic size={18} />
                            Start Voice Order
                        </button>
                    ) : (
                        <button
                            onClick={stopListening}
                            className="flex items-center gap-2 px-6 py-3.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-full font-bold transition-all cursor-pointer shadow-sm transform hover:-translate-y-0.5"
                        >
                            <Square size={16} fill="currentColor" />
                            Stop Recording
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
