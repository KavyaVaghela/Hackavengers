'use client';
import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';

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

export default function VoiceOrderPanel() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [normalizedTranscript, setNormalizedTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);

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
            setNormalizedTranscript(normalizeSpeech(currentTranscript));
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
