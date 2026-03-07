import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Grid3X3 } from 'lucide-react';

const COLORS = {
    'Stars': '#10B981', // Emerald (High demand, High margin)
    'Plowhorses': '#3B82F6', // Blue (High demand, Low margin)
    'Puzzles': '#F59E0B', // Amber (Low demand, High margin)
    'Dogs': '#EF4444' // Red (Low demand, Low margin)
};

const DESCRIPTIONS = {
    'Stars': 'High Sales + High Margin',
    'Plowhorses': 'High Sales + Low Margin',
    'Puzzles': 'Low Sales + High Margin',
    'Dogs': 'Low Sales + Low Margin'
};

export default function MenuEngineeringTable({ data }) {
    if (!data || !data.summary || data.summary.every(s => s.value === 0)) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-80 flex items-center justify-center">
                <p className="text-slate-400 font-medium">Insufficient menu or order data.</p>
            </div>
        );
    }

    // Filter out 0 value items for pie
    const pieData = data.summary.filter(s => s.value > 0);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left Side: Pie Chart */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-indigo-50 rounded-xl">
                        <Grid3X3 size={20} className="text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Menu Engineering Model</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6">Sales vs Margin Matrix Classification</p>

                <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span className="text-slate-700 font-medium ml-1 text-xs">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
                        <span className="text-3xl font-black text-slate-800">{data.detailedList.length}</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Items</span>
                    </div>
                </div>
            </div>

            {/* Right Side: List Breakdown */}
            <div className="flex flex-col">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Detailed Breakdown</h4>
                <div className="flex-1 overflow-y-auto pr-2 max-h-[300px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Item Name</th>
                                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Class</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.detailedList.map((item, idx) => {
                                // Pluralize fixes reverse mapping
                                const categoryKey = item.category + 's';
                                return (
                                    <tr key={idx} className="border-b border-slate-50 last:border-none">
                                        <td className="py-3 text-sm font-medium text-slate-800">{item.item_name}</td>
                                        <td className="py-3 text-right">
                                            <span
                                                className="inline-block px-2.5 py-1 rounded-full text-xs font-bold"
                                                style={{ backgroundColor: `${COLORS[categoryKey]}15`, color: COLORS[categoryKey] }}
                                                title={DESCRIPTIONS[categoryKey]}
                                            >
                                                {item.category}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
