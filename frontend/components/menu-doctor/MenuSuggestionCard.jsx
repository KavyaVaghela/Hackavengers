import { Star, AlertCircle } from 'lucide-react';
import FlowchartExplanation from './FlowchartExplanation';

export default function MenuSuggestionCard({ data }) {
    const isStar = data.type === 'star';
    const Icon = isStar ? Star : AlertCircle;
    const colorClass = isStar ? 'text-amber-500 bg-amber-50 border-amber-100' : 'text-red-500 bg-red-50 border-red-100';

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl border ${colorClass}`}>
                    <Icon size={24} className={isStar ? 'fill-amber-500' : ''} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{data.itemName}</h3>
                    <p className={`font-semibold mt-1 ${isStar ? 'text-amber-600' : 'text-red-600'}`}>
                        {data.suggestion}
                    </p>
                </div>
            </div>

            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-2">
                {data.reason}
            </p>

            <FlowchartExplanation steps={data.flow} />
        </div>
    );
}
