import { PackagePlus } from 'lucide-react';

export default function ComboSuggestionCard({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full flex flex-col justify-center min-h-[160px]">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Combo Recommendations</h3>
                <p className="text-slate-400 font-medium">Not enough multi-item orders to detect pairings.</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 p-6 shadow-sm h-full max-h-[400px] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-600 rounded-xl shadow-sm">
                    <PackagePlus size={20} className="text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">Frequent Pairings</h3>
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mt-0.5">Automated Combo Suggestions</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {data.map((combo, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-4 border border-indigo-50 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
                        <h4 className="font-extrabold text-slate-800 text-sm mb-1">{combo.title}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{combo.reason}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
