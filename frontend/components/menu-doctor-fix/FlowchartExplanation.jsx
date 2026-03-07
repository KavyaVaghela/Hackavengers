import { ArrowRight } from 'lucide-react';

export default function FlowchartExplanation({ steps }) {
    if (!steps || steps.length === 0) return null;

    return (
        <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Reasoning Flow</p>
            <div className="flex flex-wrap items-center gap-2">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${index === steps.length - 1
                                ? 'bg-[#FF6B2C] text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                            {step}
                        </div>
                        {index < steps.length - 1 && (
                            <ArrowRight size={14} className="text-slate-300" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
