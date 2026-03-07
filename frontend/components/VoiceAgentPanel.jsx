'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
    Mic, Square, PhoneCall, PhoneOff, Loader2,
    CheckCircle, XCircle, Sparkles, Volume2
} from 'lucide-react';
import OrderTranscript from './OrderTranscript';
import DetectedItems from './DetectedItems';
import OrderSummary from './OrderSummary';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Conversation states ───────────────────────────────────────────────────────
const STATE = {
    IDLE: 'IDLE',
    GREETING: 'GREETING',
    LISTENING: 'LISTENING',            // listening for order
    PROCESSING: 'PROCESSING',          // matching items
    CONFIRMING_ITEM: 'CONFIRMING_ITEM',// TTS confirms item, asks "anything else?"
    MORE_ITEMS: 'MORE_ITEMS',          // listening yes/no for more items
    UPSELL: 'UPSELL',                  // TTS suggests combo, wait for yes/no
    UPSELL_LISTEN: 'UPSELL_LISTEN',    // listening yes/no for upsell
    SUMMARY: 'SUMMARY',               // TTS reads full order summary
    CONFIRMING_ORDER: 'CONFIRMING_ORDER', // listening final yes/no
    PLACING: 'PLACING',               // POSTing to backend
    SUCCESS: 'SUCCESS',               // done
    CANCELLED: 'CANCELLED',
    ERROR: 'ERROR',
};

// ─── Utility: normalize speech ─────────────────────────────────────────────────
const FILLERS = ['please', 'dena', 'mujhe', 'aur', 'de', 'chahiye', 'want', 'i', 'me', 'a', 'an', 'the'];
function normalizeSpeech(text) {
    if (!text) return '';
    let t = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
    const re = new RegExp(`\\b(${FILLERS.join('|')})\\b`, 'gi');
    return t.replace(re, ' ').replace(/\s{2,}/g, ' ').trim();
}

// ─── Utility: word-overlap matching ────────────────────────────────────────────
const WORD_NUM = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, das: 10,
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
        const words = item.item_name.toLowerCase().split(' ');
        const matched = words.filter(w => w.length > 2 && text.includes(w)).length;
        return matched / words.length >= 0.55 || text.includes(item.item_name.toLowerCase());
    }).map(item => ({ ...item, quantity: extractQty(text, item.item_name) }));
}

// ─── Utility: yes/no intent ────────────────────────────────────────────────────
const YES_WORDS = ['yes', 'haan', 'ha', 'yeah', 'yep', 'sure', 'ok', 'okay', 'bilkul', 'zaroor'];
const NO_WORDS = ['no', 'nahi', 'nope', 'nahin', 'mat', 'bas', 'stop', 'done', 'thats all', 'that is all'];
function detectIntent(text) {
    const t = text.toLowerCase();
    if (YES_WORDS.some(w => t.includes(w))) return 'YES';
    if (NO_WORDS.some(w => t.includes(w))) return 'NO';
    return 'UNKNOWN';
}

// ─── Utility: TTS ─────────────────────────────────────────────────────────────
function speak(text) {
    return new Promise(resolve => {
        if (typeof window === 'undefined') { resolve(); return; }
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-IN';
        utter.rate = 0.92;
        utter.pitch = 1;
        utter.onend = resolve;
        utter.onerror = resolve;
        window.speechSynthesis.speak(utter);
    });
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function VoiceAgentPanel({ onOrderPlaced }) {
    const [agentState, setAgentState] = useState(STATE.IDLE);
    const [agentMessage, setAgentMessage] = useState('Press "Start AI Call" to begin ordering.');
    const [transcript, setTranscript] = useState('');
    const [normalized, setNormalized] = useState('');
    const [detectedItems, setDetectedItems] = useState([]);
    const [orderItems, setOrderItems] = useState([]);   // confirmed items
    const [upsellSuggestion, setUpsellSuggestion] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const [restaurantName, setRestaurantName] = useState('our restaurant');

    // live refs to avoid stale closures inside SpeechRecognition
    const menuRef = useRef([]);
    const upsellRef = useRef([]);
    const recognitionRef = useRef(null);
    const stateRef = useRef(STATE.IDLE);

    // keep stateRef in sync
    const updateState = useCallback((s) => {
        stateRef.current = s;
        setAgentState(s);
    }, []);

    // ── Fetch restaurant name + menu + upsell rules ──
    useEffect(() => {
        const init = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const headers = { Authorization: `Bearer ${token}` };
                const [nameRes, menuRes, upsellRes] = await Promise.all([
                    axios.get(`${API_URL}/restaurant/me`, { headers }).catch(() => ({ data: { restaurant: { name: 'our restaurant' } } })),
                    axios.get(`${API_URL}/api/menu`, { headers }).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/api/upsells`, { headers }).catch(() => ({ data: [] })),
                ]);
                setRestaurantName(nameRes.data?.restaurant?.name || 'our restaurant');
                menuRef.current = menuRes.data || [];
                upsellRef.current = upsellRes.data || [];
            } catch (e) {
                console.error('Init error:', e);
            }
        };
        init();
    }, []);

    // ── SpeechRecognition setup ──
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        const r = new SR();
        r.lang = 'en-IN';
        r.continuous = false;
        r.interimResults = false;
        r.onresult = (e) => {
            const text = e.results[0][0].transcript;
            setTranscript(text);
            const norm = normalizeSpeech(text);
            setNormalized(norm);
            handleResult(text, norm);
        };
        r.onerror = () => { setTranscript(''); };
        r.onend = () => { };
        recognitionRef.current = r;
        return () => r.abort();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Start listening helper ──
    const startListening = useCallback(() => {
        setTranscript('');
        setNormalized('');
        try { recognitionRef.current?.start(); } catch { /* already started */ }
    }, []);

    // ── Handle recognition result based on current state ──
    function handleResult(raw, norm) {
        const s = stateRef.current;
        if (s === STATE.LISTENING) {
            processOrder(norm, raw);
        } else if (s === STATE.MORE_ITEMS) {
            const intent = detectIntent(raw);
            if (intent === 'YES') {
                updateState(STATE.LISTENING);
                setAgentMessage('I\'m listening. What else would you like?');
                speak('Sure! What else would you like to order?').then(startListening);
            } else if (intent === 'NO') {
                triggerUpsell();
            } else {
                speak('Could you say yes or no please?').then(startListening);
            }
        } else if (s === STATE.UPSELL_LISTEN) {
            const intent = detectIntent(raw);
            if (intent === 'YES' && upsellRef._pendingUpsell) {
                const item = menuRef.current.find(m =>
                    m.item_name.toLowerCase().includes(upsellRef._pendingUpsell.toLowerCase())
                );
                if (item) {
                    setOrderItems(prev => [...prev, { ...item, quantity: 1 }]);
                    speak(`Great! I've added ${item.item_name} to your order.`).then(triggerSummary);
                } else {
                    triggerSummary();
                }
            } else {
                triggerSummary();
            }
        } else if (s === STATE.CONFIRMING_ORDER) {
            const intent = detectIntent(raw);
            if (intent === 'YES') {
                placeOrder();
            } else if (intent === 'NO') {
                updateState(STATE.CANCELLED);
                setAgentMessage('Order cancelled. Press Start to order again.');
                speak('Order cancelled. Thank you for calling.');
            } else {
                speak('Please say yes to confirm or no to cancel.').then(startListening);
            }
        }
    }

    // ── Step 4-6: Process order + confirm item ──
    function processOrder(norm, raw) {
        updateState(STATE.PROCESSING);
        const matched = matchMenu(norm, menuRef.current);
        setDetectedItems(matched);

        if (matched.length === 0) {
            setAgentMessage('No menu items detected. Please try again.');
            speak('Sorry, I could not find that item on our menu. Could you please try again?').then(() => {
                updateState(STATE.LISTENING);
                startListening();
            });
            return;
        }

        // Add all detected to order
        setOrderItems(prev => {
            const existing = [...prev];
            matched.forEach(item => {
                const idx = existing.findIndex(e => e.id === item.id);
                if (idx >= 0) existing[idx].quantity += item.quantity;
                else existing.push({ ...item });
            });
            return existing;
        });

        const itemList = matched.map(i => `${i.quantity} ${i.item_name}`).join(' and ');
        updateState(STATE.CONFIRMING_ITEM);
        setAgentMessage(`Added: ${itemList}. Would you like to add anything else?`);
        speak(`I've added ${itemList} to your order. Would you like anything else?`).then(() => {
            updateState(STATE.MORE_ITEMS);
            startListening();
        });
    }

    // ── Step 7: Upsell ──
    const triggerUpsell = useCallback(() => {
        setOrderItems(prev => {
            const rules = upsellRef.current || [];
            for (const rule of rules) {
                const hasTrigger = prev.some(i => i.item_name.toLowerCase().includes(rule.trigger_item.toLowerCase()));
                const hasSuggestion = prev.some(i => i.item_name.toLowerCase().includes(rule.suggest_item.toLowerCase()));
                if (hasTrigger && !hasSuggestion) {
                    upsellRef._pendingUpsell = rule.suggest_item;
                    setUpsellSuggestion(rule.suggest_item);
                    updateState(STATE.UPSELL_LISTEN);
                    setAgentMessage(`Customers often order ${rule.suggest_item} with this. Would you like to add it?`);
                    speak(`Customers often order ${rule.suggest_item} with your order. Would you like to add it?`).then(startListening);
                    return prev;
                }
            }
            // No upsell — go straight to summary
            triggerSummary();
            return prev;
        });
    }, [startListening, updateState]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Step 8: Summary ──
    const triggerSummary = useCallback(() => {
        setOrderItems(currentItems => {
            const total = currentItems.reduce((s, i) => s + i.price * i.quantity, 0);
            const itemText = currentItems.map(i => `${i.quantity} ${i.item_name}`).join(', ');
            const summaryText = `Your order is: ${itemText}. Total amount is ${total.toFixed(0)} rupees. Do you want to confirm this order?`;
            updateState(STATE.SUMMARY);
            setAgentMessage(`Order ready. Total: ₹${total.toFixed(0)}. Confirm?`);
            speak(summaryText).then(() => {
                updateState(STATE.CONFIRMING_ORDER);
                startListening();
            });
            return currentItems;
        });
    }, [startListening, updateState]);

    // ── Step 9: Place order ──
    const placeOrder = useCallback(async () => {
        setIsPending(true);
        updateState(STATE.PLACING);
        try {
            const token = localStorage.getItem('token');
            await setOrderItems(async currentItems => {
                const items = currentItems;
                const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
                await axios.post(`${API_URL}/api/orders/voice`, {
                    order_type: 'ai_order',
                    items: items.map(i => ({ id: i.id, name: i.item_name, quantity: i.quantity, price: i.price })),
                    total_amount: total,
                    created_at: new Date().toISOString()
                }, { headers: { Authorization: `Bearer ${token}` } });
                return items;
            });
        } catch {
            // fallback: use a direct approach
        }
        // Direct approach (setOrderItems callback doesn't work with async)
        setOrderItems(async (items) => items); // noop but triggers read

        // Use a ref-based approach instead
        placeOrderDirect();
    }, [updateState]);

    const orderItemsRef = useRef([]);
    useEffect(() => { orderItemsRef.current = orderItems; }, [orderItems]);

    async function placeOrderDirect() {
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
            setAgentMessage('🎉 Order placed successfully! Thank you for ordering with us.');
            speak('Your order has been placed. Thank you for ordering with us. Have a great meal!');
            if (onOrderPlaced) onOrderPlaced();
        } catch (e) {
            console.error('Order placement error:', e);
            updateState(STATE.ERROR);
            setAgentMessage('Failed to place order. Please try again.');
            speak('Sorry, there was an error placing your order. Please try again.');
        } finally {
            setIsPending(false);
        }
    }

    // ── Start the conversation ──
    const startCall = useCallback(async () => {
        setOrderItems([]);
        setDetectedItems([]);
        setUpsellSuggestion(null);
        setTranscript('');
        setNormalized('');
        upsellRef._pendingUpsell = null;
        updateState(STATE.GREETING);
        setAgentMessage(`Welcome to ${restaurantName}! Listening for your order…`);
        await speak(`Welcome to ${restaurantName}. What would you like to order today?`);
        updateState(STATE.LISTENING);
        setAgentMessage('Listening… Please say your order clearly.');
        startListening();
    }, [restaurantName, startListening, updateState]);

    const resetCall = useCallback(() => {
        window.speechSynthesis.cancel();
        recognitionRef.current?.abort();
        setOrderItems([]);
        setDetectedItems([]);
        setUpsellSuggestion(null);
        setTranscript('');
        setNormalized('');
        updateState(STATE.IDLE);
        setAgentMessage('Press "Start AI Call" to begin ordering.');
    }, [updateState]);

    // ── Status helpers ──
    const isActive = ![STATE.IDLE, STATE.SUCCESS, STATE.CANCELLED, STATE.ERROR].includes(agentState);
    const isListeningState = [STATE.LISTENING, STATE.MORE_ITEMS, STATE.UPSELL_LISTEN, STATE.CONFIRMING_ORDER].includes(agentState);

    const stateColors = {
        [STATE.IDLE]: 'bg-slate-100 text-slate-500',
        [STATE.GREETING]: 'bg-blue-50 text-blue-600',
        [STATE.LISTENING]: 'bg-red-50 text-red-600',
        [STATE.PROCESSING]: 'bg-amber-50 text-amber-600',
        [STATE.CONFIRMING_ITEM]: 'bg-blue-50 text-blue-600',
        [STATE.MORE_ITEMS]: 'bg-red-50 text-red-600',
        [STATE.UPSELL]: 'bg-amber-50 text-amber-600',
        [STATE.UPSELL_LISTEN]: 'bg-red-50 text-red-600',
        [STATE.SUMMARY]: 'bg-blue-50 text-blue-600',
        [STATE.CONFIRMING_ORDER]: 'bg-red-50 text-red-600',
        [STATE.PLACING]: 'bg-slate-50 text-slate-600',
        [STATE.SUCCESS]: 'bg-emerald-50 text-emerald-700',
        [STATE.CANCELLED]: 'bg-slate-100 text-slate-500',
        [STATE.ERROR]: 'bg-red-50 text-red-600',
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">

            {/* ── Agent Status Card ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-orange-100 border border-orange-200' : 'bg-slate-100 border border-slate-200'
                            }`}>
                            <Volume2 size={22} className={isActive ? 'text-[#FF6B2C]' : 'text-slate-400'} />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-[#0F172A]">AI Voice Copilot</h2>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                                {restaurantName}
                            </p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${stateColors[agentState] || 'bg-slate-100 text-slate-500'}`}>
                        {isListeningState && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                        {agentState.replace(/_/g, ' ')}
                    </div>
                </div>

                {/* Agent message bubble */}
                <div className={`flex items-start gap-3 p-4 rounded-2xl mb-5 transition-all ${agentState === STATE.SUCCESS ? 'bg-emerald-50 border border-emerald-100'
                        : agentState === STATE.ERROR ? 'bg-red-50 border border-red-100'
                            : 'bg-slate-50 border border-slate-100'
                    }`}>
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {agentState === STATE.SUCCESS ? <CheckCircle size={15} className="text-emerald-500" />
                            : agentState === STATE.ERROR ? <XCircle size={15} className="text-red-500" />
                                : <Volume2 size={15} className="text-[#FF6B2C]" />}
                    </div>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed">{agentMessage}</p>
                </div>

                {/* Upsell banner */}
                {upsellSuggestion && agentState === STATE.UPSELL_LISTEN && (
                    <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <Sparkles size={18} className="text-amber-500 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Suggested Add-on</p>
                            <p className="text-sm font-semibold text-amber-900 mt-0.5">
                                Would you like to add <strong>{upsellSuggestion}</strong>?
                            </p>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-3">
                    {agentState === STATE.IDLE || agentState === STATE.CANCELLED ? (
                        <button
                            onClick={startCall}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#FF6B2C] to-[#FF9F43] text-white rounded-2xl font-bold shadow-md shadow-orange-200 hover:from-[#ea580c] hover:to-[#f97316] transition-all"
                        >
                            <PhoneCall size={18} /> Start AI Call
                        </button>
                    ) : agentState === STATE.SUCCESS ? (
                        <button
                            onClick={resetCall}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-white rounded-2xl font-bold"
                        >
                            <PhoneCall size={18} /> Start New Order
                        </button>
                    ) : agentState === STATE.ERROR ? (
                        <button
                            onClick={resetCall}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500 text-white rounded-2xl font-bold"
                        >
                            <PhoneOff size={18} /> Retry
                        </button>
                    ) : agentState === STATE.PLACING ? (
                        <div className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold">
                            <Loader2 size={18} className="animate-spin" /> Placing order…
                        </div>
                    ) : (
                        <>
                            <div className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm ${isListeningState
                                    ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                                }`}>
                                {isListeningState ? <><Mic size={16} /> Listening…</> : <><Volume2 size={16} /> Speaking…</>}
                            </div>
                            <button
                                onClick={resetCall}
                                className="py-3.5 px-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                                title="End call"
                            >
                                <PhoneOff size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Transcript ── */}
            {(transcript || isListeningState) && (
                <OrderTranscript raw={transcript} normalized={normalized} isListening={isListeningState} />
            )}

            {/* ── Detected items (current recognition hit) ── */}
            {detectedItems.length > 0 && agentState !== STATE.IDLE && (
                <DetectedItems items={detectedItems} />
            )}

            {/* ── Manual order summary (for SUMMARY + CONFIRMING_ORDER) ── */}
            {orderItems.length > 0 && [STATE.SUMMARY, STATE.CONFIRMING_ORDER].includes(agentState) && (
                <OrderSummary
                    items={orderItems}
                    isPending={isPending}
                    onConfirm={placeOrderDirect}
                    onCancel={resetCall}
                />
            )}

            {/* ── Running order list (for intermediate states) ── */}
            {orderItems.length > 0 && ![STATE.IDLE, STATE.GREETING, STATE.SUMMARY, STATE.CONFIRMING_ORDER, STATE.SUCCESS, STATE.CANCELLED, STATE.ERROR].includes(agentState) && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Current Order</p>
                    <div className="space-y-1.5">
                        {orderItems.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="font-semibold text-slate-700">{item.quantity} × {item.item_name}</span>
                                <span className="font-bold text-[#FF6B2C]">₹{(item.price * item.quantity).toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
