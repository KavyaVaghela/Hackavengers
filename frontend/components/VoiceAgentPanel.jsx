'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
    PhoneCall, PhoneOff, Loader2, CheckCircle, XCircle,
    Sparkles, Volume2, Mic, ThumbsUp, ThumbsDown
} from 'lucide-react';
import OrderTranscript from './OrderTranscript';
import DetectedItems from './DetectedItems';
import OrderSummary from './OrderSummary';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── States ───────────────────────────────────────────────────────────────────
const STATE = {
    IDLE: 'IDLE',
    GREETING: 'GREETING',
    LISTENING: 'LISTENING',
    PROCESSING: 'PROCESSING',
    CONFIRMING_ITEM: 'CONFIRMING_ITEM',
    MORE_ITEMS: 'MORE_ITEMS',
    UPSELL_LISTEN: 'UPSELL_LISTEN',
    SUMMARY: 'SUMMARY',
    CONFIRMING_ORDER: 'CONFIRMING_ORDER',
    PLACING: 'PLACING',
    SUCCESS: 'SUCCESS',
    CANCELLED: 'CANCELLED',
    ERROR: 'ERROR',
};

// YES/NO states where we need simple intent detection
const YES_NO_STATES = [STATE.MORE_ITEMS, STATE.UPSELL_LISTEN, STATE.CONFIRMING_ORDER];

// ─── Utilities ────────────────────────────────────────────────────────────────
const FILLERS = ['please', 'dena', 'mujhe', 'aur', 'de', 'chahiye', 'want', 'i', 'me', 'a', 'an', 'the'];
function normalizeSpeech(text) {
    if (!text) return '';
    let t = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
    const re = new RegExp(`\\b(${FILLERS.join('|')})\\b`, 'gi');
    return t.replace(re, ' ').replace(/\s{2,}/g, ' ').trim();
}

const WORD_NUM = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    ek: 1, do: 2, teen: 3, char: 4, paanch: 5,
    chhe: 6, saat: 7, aath: 8, nau: 9, das: 10,
};
function extractQty(transcript, itemName) {
    const words = transcript.split(' ');
    const firstWord = itemName.toLowerCase().split(' ')[0];
    const idx = words.findIndex(w => w.includes(firstWord) || firstWord.includes(w));
    if (idx > 0) {
        for (let i = idx - 1; i >= Math.max(0, idx - 2); i--) {
            if (!isNaN(parseInt(words[i]))) return parseInt(words[i]);
            if (WORD_NUM[words[i]]) return WORD_NUM[words[i]];
        }
    }
    return 1;
}
function matchMenu(text, menu) {
    if (!text || !menu?.length) return [];
    return menu.filter(item => {
        const itemWords = item.item_name.toLowerCase().split(' ');
        const matchCount = itemWords.filter(w => w.length > 2 && text.includes(w)).length;
        return matchCount / itemWords.length >= 0.5 || text.includes(item.item_name.toLowerCase());
    }).map(item => ({ ...item, quantity: extractQty(text, item.item_name) }));
}

const YES_PATTERNS = /\b(yes|haan|ha|yeah|yep|sure|ok|okay|bilkul|zaroor|add it|go ahead|please add|sounds good|great|perfect)\b/i;
const NO_PATTERNS = /\b(no|nahi|nope|nahin|nahin ji|mat|bas|stop|done|nothing|thats all|that is all|skip|cancel|dont|nah)\b/i;
function detectIntent(text) {
    if (YES_PATTERNS.test(text)) return 'YES';
    if (NO_PATTERNS.test(text)) return 'NO';
    return 'UNKNOWN';
}

// ─── Human-like TTS ───────────────────────────────────────────────────────────
let selectedVoice = null;
function initVoice() {
    if (typeof window === 'undefined') return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer in order: en-IN female → en-GB female → en-US female → any
    const preferred = [
        v => v.lang === 'en-IN' && v.name.toLowerCase().includes('female'),
        v => v.lang === 'en-IN',
        v => v.lang === 'en-GB' && v.name.toLowerCase().includes('female'),
        v => v.lang === 'en-GB',
        v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'),
        v => v.lang.startsWith('en'),
    ];
    for (const fn of preferred) {
        const v = voices.find(fn);
        if (v) { selectedVoice = v; break; }
    }
}

function speak(text) {
    return new Promise(resolve => {
        if (typeof window === 'undefined') { resolve(); return; }
        window.speechSynthesis.cancel();
        if (!selectedVoice) initVoice();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = selectedVoice?.lang || 'en-IN';
        utter.voice = selectedVoice || null;
        utter.rate = 0.88;
        utter.pitch = 1.1;
        utter.volume = 1;
        utter.onend = resolve;
        utter.onerror = resolve;
        window.speechSynthesis.speak(utter);

        // Chrome bug: speechSynthesis sometimes freezes, resume as workaround
        const resume = setInterval(() => {
            if (!window.speechSynthesis.speaking) clearInterval(resume);
            else window.speechSynthesis.resume();
        }, 5000);
    });
}

// ─── Create a fresh recognition instance per session ─────────────────────────
function createRecognition(onResult, onEnd, onError) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = 'en-IN';
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 3;

    r.onresult = (e) => {
        const result = e.results[0];
        if (!result) return;
        // Try all alternatives - pick first that gives useful text
        const text = result[0].transcript;
        onResult(text);
    };
    r.onend = onEnd;
    r.onerror = (e) => {
        console.warn('SR error:', e.error);
        onError(e.error);
    };
    return r;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VoiceAgentPanel({ onOrderPlaced }) {
    const [agentState, setAgentState] = useState(STATE.IDLE);
    const [agentMessage, setAgentMessage] = useState('Press "Start AI Call" to begin.');
    const [transcript, setTranscript] = useState('');
    const [normalized, setNormalized] = useState('');
    const [detectedItems, setDetectedItems] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [upsellSuggestion, setUpsellSuggestion] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const [restaurantName, setRestaurantName] = useState('our restaurant');
    const [listenHint, setListenHint] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    const menuRef = useRef([]);
    const upsellRef = useRef([]);
    const stateRef = useRef(STATE.IDLE);
    const orderItemsRef = useRef([]);
    const recognitionRef = useRef(null);
    const listeningRef = useRef(false);

    const updateState = useCallback((s) => {
        stateRef.current = s;
        setAgentState(s);
    }, []);

    useEffect(() => { orderItemsRef.current = orderItems; }, [orderItems]);

    // init voices (Chrome loads voices async)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        initVoice();
        window.speechSynthesis.onvoiceschanged = initVoice;
    }, []);

    // fetch data on mount
    useEffect(() => {
        const init = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const h = { Authorization: `Bearer ${token}` };
                const [nameRes, menuRes, upsellRes] = await Promise.all([
                    axios.get(`${API_URL}/restaurant/me`, { headers: h }).catch(() => ({ data: { restaurant: { name: 'our restaurant' } } })),
                    axios.get(`${API_URL}/api/menu`, { headers: h }).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/api/upsells`, { headers: h }).catch(() => ({ data: [] })),
                ]);
                setRestaurantName(nameRes.data?.restaurant?.name || 'our restaurant');
                menuRef.current = menuRes.data || [];
                upsellRef.current = upsellRes.data || [];
            } catch (e) { console.error('Init error', e); }
        };
        init();
    }, []);

    // ── Listen: creates a fresh Recognition instance each time ──────────────
    const startListening = useCallback((hint = '') => {
        if (listeningRef.current) return; // already listening
        listeningRef.current = true;
        setTranscript('');
        setNormalized('');
        setListenHint(hint);

        const onResult = (text) => {
            listeningRef.current = false;
            setRetryCount(0);
            setTranscript(text);
            const norm = normalizeSpeech(text);
            setNormalized(norm);
            handleResult(text, norm);
        };

        const onEnd = () => { listeningRef.current = false; };
        const onError = (errCode) => {
            listeningRef.current = false;
            // On no-speech or aborted, retry automatically up to 2 times
            if (errCode === 'no-speech' || errCode === 'aborted') {
                setRetryCount(c => {
                    if (c < 2) {
                        setTimeout(() => startListening(hint), 500);
                        return c + 1;
                    }
                    // After 2 silent retries, re-prompt
                    setListenHint("I didn't catch that. Please tap Yes or No below.");
                    return 0;
                });
            }
        };

        const r = createRecognition(onResult, onEnd, onError);
        if (!r) {
            setAgentMessage('Speech recognition not supported. Please use the buttons below.');
            listeningRef.current = false;
            return;
        }
        recognitionRef.current = r;
        try { r.start(); } catch (e) { listeningRef.current = false; }
    }, []); // eslint-disable-line

    // ── Handle YES/NO intent plus order listening ────────────────────────────
    // Using a ref wrapper so the function always sees fresh state
    const handleResultRef = useRef(null);
    handleResultRef.current = (raw, norm) => {
        const s = stateRef.current;
        if (s === STATE.LISTENING) {
            processOrder(norm, raw);
        } else if (YES_NO_STATES.includes(s)) {
            handleYesNo(raw, s);
        }
    };
    function handleResult(raw, norm) { handleResultRef.current(raw, norm); }

    function handleYesNo(raw, s) {
        const intent = detectIntent(raw);
        if (s === STATE.MORE_ITEMS) {
            if (intent === 'YES') {
                updateState(STATE.LISTENING);
                setAgentMessage("Great! What else would you like?");
                speak("Sure! What else can I get for you?").then(() => startListening("Tell me your next item"));
            } else if (intent === 'NO') {
                doUpsell();
            } else {
                speak("I'm sorry, I didn't catch that. Please say yes or no, or tap a button.").then(() => startListening("Say YES or NO"));
            }
        } else if (s === STATE.UPSELL_LISTEN) {
            if (intent === 'YES') { addUpsell(); }
            else { doSummary(); }
        } else if (s === STATE.CONFIRMING_ORDER) {
            if (intent === 'YES') { placeOrderDirect(); }
            else if (intent === 'NO') {
                updateState(STATE.CANCELLED);
                setAgentMessage('Order cancelled. Have a great day!');
                speak('No problem! Your order has been cancelled. Have a wonderful day!');
            } else {
                speak("Just say yes to confirm or no to cancel your order.").then(() => startListening("Say YES or NO"));
            }
        }
    }

    // ── Manual YES/NO buttons as reliable fallback ──────────────────────────
    const handleManualIntent = useCallback((intent) => {
        if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch { } }
        listeningRef.current = false;
        const s = stateRef.current;
        handleYesNo(intent === 'YES' ? 'yes' : 'no', s);
    }, []); // eslint-disable-line

    // ── Process order transcript ─────────────────────────────────────────────
    const processOrderRef = useRef(null);
    processOrderRef.current = (norm, raw) => {
        updateState(STATE.PROCESSING);
        const matched = matchMenu(norm, menuRef.current);
        setDetectedItems(matched);

        if (matched.length === 0) {
            setAgentMessage("Hmm, I couldn't find that item. Could you please repeat?");
            speak("I'm sorry, I couldn't find that item on the menu. Could you say it again?").then(() => {
                updateState(STATE.LISTENING);
                startListening("Tell me what you'd like to order");
            });
            return;
        }

        setOrderItems(prev => {
            const updated = [...prev];
            matched.forEach(item => {
                const idx = updated.findIndex(e => e.id === item.id);
                if (idx >= 0) updated[idx].quantity += item.quantity;
                else updated.push({ ...item });
            });
            return updated;
        });

        const itemList = matched.map(i => `${i.quantity} ${i.item_name}`).join(' and ');
        updateState(STATE.CONFIRMING_ITEM);
        setAgentMessage(`Added: ${itemList}. Would you like to order anything else?`);
        speak(`Perfect! I've added ${itemList} to your order. That sounds delicious! Would you like anything else?`).then(() => {
            updateState(STATE.MORE_ITEMS);
            startListening("Say YES for more items or NO to finish");
        });
    };
    function processOrder(norm, raw) { processOrderRef.current(norm, raw); }

    // ── Upsell logic ─────────────────────────────────────────────────────────
    const upsellPendingRef = useRef(null);
    function doUpsell() {
        const items = orderItemsRef.current;
        const rules = upsellRef.current || [];
        for (const rule of rules) {
            const hasTrigger = items.some(i => i.item_name.toLowerCase().includes(rule.trigger_item.toLowerCase()));
            const hasSuggestion = items.some(i => i.item_name.toLowerCase().includes(rule.suggest_item.toLowerCase()));
            if (hasTrigger && !hasSuggestion) {
                upsellPendingRef.current = rule.suggest_item;
                setUpsellSuggestion(rule.suggest_item);
                updateState(STATE.UPSELL_LISTEN);
                setAgentMessage(`💡 Customers love ${rule.suggest_item} with this! Want to add it?`);
                speak(`Oh, by the way! Our customers absolutely love having ${rule.suggest_item} with that. Would you like to add it to your order?`)
                    .then(() => startListening("Say YES to add or NO to skip"));
                return;
            }
        }
        doSummary();
    }
    function addUpsell() {
        const name = upsellPendingRef.current;
        const item = menuRef.current.find(m => m.item_name.toLowerCase().includes((name || '').toLowerCase()));
        if (item) {
            setOrderItems(prev => [...prev, { ...item, quantity: 1 }]);
            speak(`Wonderful! I've added ${item.item_name} to your order. Great choice!`).then(doSummary);
        } else {
            doSummary();
        }
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    function doSummary() {
        const items = orderItemsRef.current;
        const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
        const itemText = items.map(i => `${i.quantity} ${i.item_name}`).join(', ');
        const summaryText = `Alright! Let me read your order. You have ${itemText}. Your total comes to ${total.toFixed(0)} rupees. That's a wonderful choice! Shall I go ahead and confirm this order for you?`;
        updateState(STATE.SUMMARY);
        setAgentMessage(`Order total: ₹${total.toFixed(0)} — Ready to confirm?`);
        speak(summaryText).then(() => {
            updateState(STATE.CONFIRMING_ORDER);
            startListening("Say YES to confirm or NO to cancel");
        });
    }

    // ── Place order ──────────────────────────────────────────────────────────
    async function placeOrderDirect() {
        setIsPending(true);
        updateState(STATE.PLACING);
        try {
            const token = localStorage.getItem('token');
            const items = orderItemsRef.current;
            const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
            await axios.post(`${API_URL}/api/orders/voice`, {
                order_type: 'ai_order',
                items: items.map(i => ({ id: i.id, name: i.item_name, quantity: i.quantity, price: i.price })),
                total_amount: total,
                created_at: new Date().toISOString()
            }, { headers: { Authorization: `Bearer ${token}` } });
            updateState(STATE.SUCCESS);
            setAgentMessage('🎉 Order placed! Thank you for ordering with us!');
            speak('Fantastic! Your order has been placed successfully. Thank you so much for ordering with us today! We hope you enjoy your meal. Have a wonderful day!');
            if (onOrderPlaced) onOrderPlaced();
        } catch (e) {
            console.error('Order error:', e);
            updateState(STATE.ERROR);
            setAgentMessage('Something went wrong. Please try again.');
            speak('Oh no, something went wrong while placing your order. I apologize for the inconvenience. Please try again.');
        } finally {
            setIsPending(false);
        }
    }

    // ── Start conversation ────────────────────────────────────────────────────
    const startCall = useCallback(async () => {
        setOrderItems([]);
        setDetectedItems([]);
        setUpsellSuggestion(null);
        setTranscript('');
        setNormalized('');
        setRetryCount(0);
        upsellPendingRef.current = null;
        updateState(STATE.GREETING);
        setAgentMessage(`Welcome to ${restaurantName}!`);
        await speak(`Hello! Welcome to ${restaurantName}. I'm your AI voice ordering assistant. I'm ready to take your order. What would you like to have today?`);
        updateState(STATE.LISTENING);
        setAgentMessage('Listening… Please say your order.');
        startListening("Tell me what you'd like to order");
    }, [restaurantName, startListening, updateState]);

    const resetCall = useCallback(() => {
        window.speechSynthesis.cancel();
        if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch { } }
        listeningRef.current = false;
        setOrderItems([]);
        setDetectedItems([]);
        setUpsellSuggestion(null);
        setTranscript('');
        setNormalized('');
        updateState(STATE.IDLE);
        setAgentMessage('Press "Start AI Call" to begin.');
    }, [updateState]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const isYesNoState = YES_NO_STATES.includes(agentState);
    const isListeningState = isYesNoState || agentState === STATE.LISTENING;
    const isActive = ![STATE.IDLE, STATE.SUCCESS, STATE.CANCELLED, STATE.ERROR].includes(agentState);

    const stateLabel = {
        [STATE.IDLE]: 'Ready',
        [STATE.GREETING]: 'Speaking…',
        [STATE.LISTENING]: 'Listening',
        [STATE.PROCESSING]: 'Processing',
        [STATE.CONFIRMING_ITEM]: 'Speaking…',
        [STATE.MORE_ITEMS]: 'Waiting for reply',
        [STATE.UPSELL_LISTEN]: 'Waiting for reply',
        [STATE.SUMMARY]: 'Speaking…',
        [STATE.CONFIRMING_ORDER]: 'Waiting for reply',
        [STATE.PLACING]: 'Placing order…',
        [STATE.SUCCESS]: 'Order Placed ✓',
        [STATE.CANCELLED]: 'Cancelled',
        [STATE.ERROR]: 'Error',
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">

            {/* ── Main agent card ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-orange-100 border border-orange-200' : 'bg-slate-100 border border-slate-200'}`}>
                            {isListeningState
                                ? <Mic size={22} className="text-red-500 animate-pulse" />
                                : <Volume2 size={22} className={isActive ? 'text-[#FF6B2C]' : 'text-slate-400'} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-[#0F172A]">AI Voice Copilot</h2>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{restaurantName}</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${agentState === STATE.SUCCESS ? 'bg-emerald-50 text-emerald-700'
                            : agentState === STATE.ERROR ? 'bg-red-50 text-red-600'
                                : isListeningState ? 'bg-red-50 text-red-600'
                                    : isActive ? 'bg-blue-50 text-blue-600'
                                        : 'bg-slate-100 text-slate-500'}`}>
                        {isListeningState && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                        {stateLabel[agentState] || agentState}
                    </div>
                </div>

                {/* Message bubble */}
                <div className={`flex items-start gap-3 p-4 rounded-2xl mb-5 ${agentState === STATE.SUCCESS ? 'bg-emerald-50 border border-emerald-100'
                        : agentState === STATE.ERROR ? 'bg-red-50 border border-red-100'
                            : 'bg-slate-50 border border-slate-100'}`}>
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {agentState === STATE.SUCCESS ? <CheckCircle size={15} className="text-emerald-500" />
                            : agentState === STATE.ERROR ? <XCircle size={15} className="text-red-500" />
                                : <Volume2 size={15} className="text-[#FF6B2C]" />}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">{agentMessage}</p>
                        {listenHint && isListeningState && (
                            <p className="text-xs text-slate-400 mt-1 italic">{listenHint}</p>
                        )}
                        {retryCount > 0 && (
                            <p className="text-xs text-amber-500 mt-1">🔄 Retrying… ({retryCount}/2)</p>
                        )}
                    </div>
                </div>

                {/* Upsell banner */}
                {upsellSuggestion && agentState === STATE.UPSELL_LISTEN && (
                    <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <Sparkles size={18} className="text-amber-500 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Popular Combo</p>
                            <p className="text-sm font-semibold text-amber-900 mt-0.5">
                                Would you like to add <strong>{upsellSuggestion}</strong>?
                            </p>
                        </div>
                    </div>
                )}

                {/* YES / NO tap buttons — always visible during yes/no states */}
                {isYesNoState && (
                    <div className="flex gap-3 mb-5">
                        <button
                            onClick={() => handleManualIntent('YES')}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 text-emerald-700 rounded-2xl font-bold text-sm transition-all"
                        >
                            <ThumbsUp size={16} /> Yes
                        </button>
                        <button
                            onClick={() => handleManualIntent('NO')}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 rounded-2xl font-bold text-sm transition-all"
                        >
                            <ThumbsDown size={16} /> No
                        </button>
                    </div>
                )}

                {/* Main action controls */}
                <div className="flex items-center gap-3">
                    {agentState === STATE.IDLE || agentState === STATE.CANCELLED ? (
                        <button onClick={startCall}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#FF6B2C] to-[#FF9F43] text-white rounded-2xl font-bold shadow-md shadow-orange-200 hover:from-[#ea580c] hover:to-[#f97316] transition-all">
                            <PhoneCall size={18} /> Start AI Call
                        </button>
                    ) : agentState === STATE.SUCCESS ? (
                        <button onClick={resetCall}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all">
                            <PhoneCall size={18} /> Start New Order
                        </button>
                    ) : agentState === STATE.ERROR ? (
                        <button onClick={resetCall}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all">
                            <PhoneOff size={18} /> Try Again
                        </button>
                    ) : agentState === STATE.PLACING ? (
                        <div className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold">
                            <Loader2 size={18} className="animate-spin" /> Placing order…
                        </div>
                    ) : (
                        <>
                            <div className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm ${isListeningState
                                    ? 'bg-red-50 text-red-600 border-2 border-red-200 animate-pulse'
                                    : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                                {isListeningState ? <><Mic size={16} /> Listening…</> : <><Volume2 size={16} /> Speaking…</>}
                            </div>
                            <button onClick={resetCall}
                                className="py-3.5 px-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                                title="End call">
                                <PhoneOff size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Transcript */}
            {(transcript || isListeningState) && (
                <OrderTranscript raw={transcript} normalized={normalized} isListening={isListeningState} />
            )}

            {/* Detected items */}
            {detectedItems.length > 0 && agentState !== STATE.IDLE && (
                <DetectedItems items={detectedItems} />
            )}

            {/* Order summary for final confirmation */}
            {orderItems.length > 0 && [STATE.SUMMARY, STATE.CONFIRMING_ORDER].includes(agentState) && (
                <OrderSummary
                    items={orderItems}
                    isPending={isPending}
                    onConfirm={placeOrderDirect}
                    onCancel={resetCall}
                />
            )}

            {/* Running tally */}
            {orderItems.length > 0 && ![STATE.IDLE, STATE.GREETING, STATE.SUMMARY, STATE.CONFIRMING_ORDER, STATE.PLACING, STATE.SUCCESS, STATE.CANCELLED, STATE.ERROR].includes(agentState) && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Current Order</p>
                    <div className="space-y-1.5">
                        {orderItems.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="font-semibold text-slate-700">{item.quantity} × {item.item_name}</span>
                                <span className="font-bold text-[#FF6B2C]">₹{(item.price * item.quantity).toFixed(0)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-sm pt-2 border-t border-slate-100 mt-2">
                            <span className="font-extrabold text-slate-800">Subtotal</span>
                            <span className="font-extrabold text-[#FF6B2C]">₹{orderItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(0)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
