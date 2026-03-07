import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import fuzz from 'fuzzball';
import { Mic, Square, Loader2, Volume2, ShoppingBag, Sparkles } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const normalizeSpeech = (text) => {
    if (!text) return '';
    let normalized = text.toLowerCase();

    // Remove punctuation
    normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

    // Remove filler words
    const fillers = ['please', 'dena', 'mujhe', 'ek', 'aur'];
    const fillerRegex = new RegExp(`\\b(${fillers.join('|')})\\b`, 'gi');
    normalized = normalized.replace(fillerRegex, ' ');

    // Trim multiple spaces
    normalized = normalized.replace(/\s{2,}/g, ' ').trim();
    return normalized;
};

const WORD_TO_NUMBER = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5,
    'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10
};

const extractQuantity = (transcript, itemName) => {
    if (!transcript) return 1;
    const words = transcript.split(' ');
    const nameWords = itemName.toLowerCase().split(' ');

    // Find where the item name starts in the transcript
    const idx = words.findIndex(w => nameWords[0].includes(w) || w.includes(nameWords[0]));

    if (idx > 0) {
        // Check the word immediately before the item
        for (let i = idx - 1; i >= Math.max(0, idx - 2); i--) {
            const word = words[i];
            if (!isNaN(parseInt(word))) {
                return parseInt(word);
            }
            if (WORD_TO_NUMBER[word]) {
                return WORD_TO_NUMBER[word];
            }
        }
    }
    return 1;
};

const detectModifiers = (transcript) => {
    const modifiers = {
        size: null,
        spice: null,
        removals: []
    };
    if (!transcript) return modifiers;

    const t = ' ' + transcript + ' ';

    // Sizes
    if (t.includes(' small ')) modifiers.size = 'small';
    else if (t.includes(' medium ')) modifiers.size = 'medium';
    else if (t.includes(' large ')) modifiers.size = 'large';

    // Spice
    if (t.includes(' extra spicy ') || t.includes(' bahut spicy ') || t.includes(' jyada spicy ')) modifiers.spice = 'extra spicy';
    else if (t.includes(' spicy ') || t.includes(' teekha ')) modifiers.spice = 'spicy';
    else if (t.includes(' mild ') || t.includes(' kam spicy ') || t.includes(' no spicy ')) modifiers.spice = 'mild';

    // Removals (no onion, bina cheese, without tomato)
    const removalRegex = /\b(no|bina|without)\s+(\w+)\b/gi;
    let match;
    while ((match = removalRegex.exec(transcript)) !== null) {
        modifiers.removals.push(match[2].toLowerCase());
    }

    return modifiers;
};

const matchMenuItems = (text, menu) => {
    if (!text || !menu || menu.length === 0) return [];

    // Split the speech into potential words/phrases
    const words = text.split(' ');
    let detected = [];

    // Simple iteration to find best matches in the active menu
    menu.forEach(item => {
        // RapidFuzz Partial Ratio (finds string similarity)
        const score = fuzz.partial_ratio(item.item_name.toLowerCase(), text);

        // If the fuzzy match is highly confident (e.g > 85%)
        if (score > 85) {
            // Prevent duplicate detections of the same item name in a single breath
            if (!detected.find(d => d.id === item.id)) {
                const quantity = extractQuantity(text, item.item_name);
                detected.push({ ...item, quantity });
            }
        }
    });

    return detected;
};

export default function VoiceOrderPanel() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [normalizedTranscript, setNormalizedTranscript] = useState('');
    const [matchedItems, setMatchedItems] = useState([]);
    const [detectedModifiers, setDetectedModifiers] = useState({ size: null, spice: null, removals: [] });
    const [menuList, setMenuList] = useState([]);
    const [upsellRules, setUpsellRules] = useState([]);
    const [upsellSuggestion, setUpsellSuggestion] = useState(null);
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);

    // Initial Fetch of Menu and Upsell Rules
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const [menuRes, upsellRes] = await Promise.all([
                    axios.get(`${API_URL}/api/menu`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/upsells`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
                ]);

                setMenuList(menuRes.data);
                setUpsellRules(upsellRes.data || []);
            } catch (err) {
                console.error("Failed to fetch data for AI call", err);
            }
        };
        fetchData();
    }, []);

    const suggestUpsell = (orderItems, rules) => {
        if (!orderItems.length || !rules.length) return null;

        // Find the most appropriate upsell based on priority (first match)
        for (const rule of rules) {
            // Check if triggers exist in the order, and the suggestion does not already exist
            const hasTrigger = orderItems.some(i => i.item_name.toLowerCase().includes(rule.trigger_item.toLowerCase()));
            const hasSuggestion = orderItems.some(i => i.item_name.toLowerCase().includes(rule.suggest_item.toLowerCase()));

            if (hasTrigger && !hasSuggestion) {
                return rule.suggest_item;
            }
        }
        return null;
    };

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Your browser does not support Web Speech API. Please use Google Chrome.');
            return;
        }

        const recognition = new SpeechRecognition();

        // Settings for Hinglish/Hindi/English
        // 'en-IN' works great for Indian English accents and mixed Hinglish.
        // If strict Hindi is needed, 'hi-IN' can be used instead.
        recognition.lang = 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            setTranscript(currentTranscript);
            const normalized = normalizeSpeech(currentTranscript);
            setNormalizedTranscript(normalized);

            const newlyMatched = matchMenuItems(normalized, menuList);
            setMatchedItems(newlyMatched);

            // Suggest Upsells
            setUpsellSuggestion(suggestUpsell(newlyMatched, upsellRules));

            setDetectedModifiers(detectModifiers(normalized));
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setError(`Error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startListening = () => {
        setTranscript('');
        setNormalizedTranscript('');
        setMatchedItems([]);
        setUpsellSuggestion(null);
        setDetectedModifiers({ size: null, spice: null, removals: [] });
        setError(null);
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (err) {
                console.error('Could not start recognition:', err);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const handleConfirmOrder = () => {
        alert("Order Confirmed! Sending to Kitchen...");
        // In real app: POST to /api/orders
        setTranscript('');
        setMatchedItems([]);
        setUpsellSuggestion(null);
        setDetectedModifiers({ size: null, spice: null, removals: [] });
    };

    const handleCancelOrder = () => {
        setTranscript('');
        setMatchedItems([]);
        setUpsellSuggestion(null);
        setDetectedModifiers({ size: null, spice: null, removals: [] });
    };

    const calculateTotal = () => {
        return matchedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-3xl border border-slate-200 shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                    <Volume2 size={20} className="text-orange-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Voice Ordering</h2>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">English • Hindi • Hinglish</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-6">
                {/* Transcript Display */}
                <div className="bg-slate-50 rounded-2xl p-6 min-h-[160px] border border-slate-200 shadow-inner relative">
                    {!transcript && !isListening && (
                        <p className="text-slate-400 italic font-medium absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full">
                            Click start to begin capturing voice input...
                        </p>
                    )}
                    {transcript && (
                        <div className="flex flex-col gap-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Raw Transcript</p>
                                <p className="text-slate-800 text-lg leading-relaxed font-medium">
                                    {transcript}
                                </p>
                            </div>

                            {normalizedTranscript && (
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Normalized Output</p>
                                    <p className="text-emerald-700 text-lg leading-relaxed font-semibold bg-emerald-50 inline-block px-3 py-1 rounded-lg border border-emerald-100/50">
                                        {normalizedTranscript}
                                    </p>
                                </div>
                            )}

                            {matchedItems.length > 0 && (
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-transparent">
                                        <ShoppingBag size={14} /> Detect Order Items
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {matchedItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 border border-blue-100 bg-blue-50/50 rounded-xl">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{item.item_name} &times; {item.quantity}</span>
                                                    <span className="text-xs font-semibold text-slate-500">{item.category}</span>
                                                </div>
                                                <span className="font-extrabold text-[#FF6B2C]">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(detectedModifiers.size || detectedModifiers.spice || detectedModifiers.removals.length > 0) && (
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-transparent">
                                        Order Modifiers
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {detectedModifiers.size && (
                                            <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-[13px] font-bold border border-purple-100/50 shadow-sm">
                                                Size: <span className="capitalize">{detectedModifiers.size}</span>
                                            </span>
                                        )}
                                        {detectedModifiers.spice && (
                                            <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-[13px] font-bold border border-red-100/50 shadow-sm">
                                                Spice: <span className="capitalize">{detectedModifiers.spice}</span>
                                            </span>
                                        )}
                                        {detectedModifiers.removals.map((removal, idx) => (
                                            <span key={idx} className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full text-[13px] font-bold border border-slate-200 shadow-sm">
                                                No <span className="capitalize">{removal}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {upsellSuggestion && (
                                <div className="mt-2 flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-sm animate-fade-in">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                        <Sparkles size={16} className="text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-0.5">Recommended Add-on</p>
                                        <p className="text-sm text-amber-900 font-medium">Would you like to add <span className="font-extrabold">{upsellSuggestion}</span> with your order?</p>
                                    </div>
                                    <button
                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors"
                                        onClick={() => {
                                            const matched = menuList.find(i => i.item_name.toLowerCase().includes(upsellSuggestion.toLowerCase()));
                                            if (matched) {
                                                setMatchedItems(prev => [...prev, { ...matched, quantity: 1 }]);
                                                setUpsellSuggestion(null);
                                            }
                                        }}
                                    >
                                        Add Item
                                    </button>
                                </div>
                            )}

                            {matchedItems.length > 0 && !isListening && (
                                <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200">
                                    <h3 className="font-extrabold text-[#0F172A] mb-4 text-center">Order Summary</h3>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                                        {matchedItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                                                <span className="font-semibold text-slate-700">
                                                    {item.quantity} × {item.item_name}
                                                </span>
                                                <span className="font-bold text-slate-800">
                                                    ₹{item.price * item.quantity}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-lg pt-2 mt-2 border-t border-slate-300">
                                            <span className="font-extrabold text-slate-900">Total Price:</span>
                                            <span className="font-black text-[#FF6B2C]">₹{calculateTotal()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-6">
                                        <button
                                            onClick={handleCancelOrder}
                                            className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors shadow-sm"
                                        >
                                            Cancel Order
                                        </button>
                                        <button
                                            onClick={handleConfirmOrder}
                                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors shadow-emerald-500/20 shadow-md flex items-center justify-center gap-2"
                                        >
                                            Confirm Order
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {isListening && (
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-full text-xs font-bold animate-pulse shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            Listening
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mt-2">
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
