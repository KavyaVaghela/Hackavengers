import { TrendingUp, BadgePercent } from 'lucide-react';
import FlowchartExplanation from './FlowchartExplanation';

export default function PriceSuggestionCard({ data }) {
    const isIncrease = data.type === 'increase';
    const Icon = isIncrease ? TrendingUp : BadgePercent;
    const colorClass = isIncrease ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100';

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl border ${colorClass}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{data.itemName}</h3>
                    <p className="text-[#FF6B2C] font-semibold mt-1">{data.suggestion}</p>
                </div>
            </div>

            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-2">
                {data.reason}
            </p>

            <FlowchartExplanation steps={data.flow} />
        </div>
    );
}
