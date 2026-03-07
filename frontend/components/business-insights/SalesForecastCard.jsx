import { BrainCircuit, ArrowUpRight, Clock, Star, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalesForecastCard({ data }) {
    if (!data || !data.trendData || data.trendData.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full flex flex-col justify-center min-h-[160px]">
                <h3 className="text-lg font-bold text-slate-800 mb-2">AI Sales Forecast</h3>
                <p className="text-slate-400 font-medium">Insufficient history to predict future sales.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg shadow-slate-900/20 text-white relative overflow-hidden flex flex-col h-full">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-fuchsia-600/20 blur-[60px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md">
                    <BrainCircuit size={20} className="text-violet-300" />
                </div>
                <div>
                    <h3 className="text-lg font-black tracking-tight drop-shadow-sm">AI Sales Predictor</h3>
                    <p className="text-xs font-semibold text-violet-300 uppercase tracking-widest mt-0.5">Tomorrow&apos;s Forecast</p>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                {/* Revenue stat block */}
                <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><ArrowUpRight size={14} className="text-emerald-400" /> Expected Revenue</p>
                    <p className="text-4xl font-black text-white tracking-tight">₹{data.predictedRevenue.toLocaleString()}</p>
                </div>

                {/* Sub stats */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock size={12} className="text-amber-400" /> Peak Hour</p>
                    <p className="font-bold text-sm">{data.peakHour}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Star size={12} className="text-fuchsia-400" /> Top Item</p>
                    <p className="font-bold text-sm truncate" title={data.expectedTopItem}>{data.expectedTopItem}</p>
                </div>
            </div>

            {/* Sparkline Chart */}
            <div className="h-24 w-full mt-auto relative z-10 mb-6">
                <p className="text-xs font-semibold text-slate-500 mb-2">Rolling 7-Day Trend</p>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trendData}>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#94A3B8', fontSize: '12px' }}
                            formatter={(value, name) => [`₹${value}`, name]}
                        />
                        {/* Actual History Line */}
                        <Line type="monotone" dataKey="actual" stroke="#8B5CF6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                        {/* Predicted Point (Tomorrow) */}
                        <Line type="monotone" dataKey="predicted" stroke="#A78BFA" strokeWidth={3} dot={{ r: 4, fill: '#A78BFA' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Flowchart */}
            {data.flow && data.flow.length > 0 && (
                <div className="relative z-10 border-t border-white/10 pt-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Model Flow Path</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {data.flow.map((step, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                                <div className={`px-2 py-1 rounded text-[10px] font-bold ${index === data.flow.length - 1
                                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                    : 'text-slate-400'
                                    }`}>
                                    {step}
                                </div>
                                {index < data.flow.length - 1 && (
                                    <ArrowRight size={10} className="text-slate-600" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
