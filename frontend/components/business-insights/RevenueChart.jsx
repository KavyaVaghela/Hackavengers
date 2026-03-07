import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { IndianRupee } from 'lucide-react';

export default function RevenueChart({ data, title }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-80 flex items-center justify-center">
                <p className="text-slate-400 font-medium">No revenue data available yet.</p>
            </div>
        );
    }

    // Pre-format X axis dynamically based on data format (YYYY-MM-DD vs YYYY-MM)
    const formattedData = data.map(item => {
        let tick = item.date || item.month;
        if (tick && tick.includes('-')) {
            const parts = tick.split('-');
            if (parts.length === 3) {
                tick = `${parts[2]}/${parts[1]}`; // DD/MM
            } else if (parts.length === 2) {
                const date = new Date(tick + '-01');
                tick = date.toLocaleString('default', { month: 'short', year: '2-digit' }); // Jan 23
            }
        }
        return { ...item, displayDate: tick };
    });

    const total = data.reduce((acc, curr) => acc + parseFloat(curr.revenue), 0);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Total: ₹{total.toLocaleString()}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl">
                    <IndianRupee size={20} className="text-emerald-500" />
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#64748B' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#64748B' }}
                            dx={-10}
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#10B981', fontWeight: 600 }}
                            labelStyle={{ color: '#64748B', marginBottom: '4px' }}
                            formatter={(value) => [`₹${parseFloat(value).toLocaleString()}`, 'Revenue']}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
