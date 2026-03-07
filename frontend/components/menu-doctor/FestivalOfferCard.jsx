import { Gift, UtensilsCrossed } from 'lucide-react';
import FlowchartExplanation from './FlowchartExplanation';

export default function FestivalOfferCard({ data }) {
    return (
        <div className="bg-gradient-to-br from-[#FFF7ED] to-white rounded-2xl border border-[#FF9F43]/30 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-[#FF6B2C] text-white shadow-sm shadow-[#FF6B2C]/20">
                    <Gift size={20} />
                </div>
                <h3 className="text-xl text-slate-900 font-extrabold tracking-tight">
                    {data.offerName}
                </h3>
            </div>

            <div className="bg-white border border-orange-100 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex flex-col gap-2">
                    {data.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <UtensilsCrossed size={14} className="text-[#FF9F43]" />
                            <span className="text-sm font-bold text-slate-800">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            <p className="font-semibold text-[#FF6B2C] mb-2">{data.suggestion}</p>
            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                {data.reason}
            </p>

            <FlowchartExplanation steps={data.flow} />
        </div>
    );
}
