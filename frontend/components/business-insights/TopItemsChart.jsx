import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Award } from 'lucide-react';

export default function TopItemsChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-80 flex items-center justify-center">
                <p className="text-slate-400 font-medium">No order data available yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Top 10 Selling Items</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Volume of items sold</p>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl">
                    <Award size={20} className="text-amber-500" />
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                        <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#64748B' }}
                        />
                        <YAxis
                            dataKey="item_name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                            width={110}
                        />
                        <Tooltip
                            cursor={{ fill: '#F1F5F9' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#F59E0B', fontWeight: 600 }}
                            formatter={(value) => [value, 'Units Sold']}
                        />
                        <Bar dataKey="total_sold" radius={[0, 4, 4, 0]} maxBarSize={30}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#F59E0B' : '#FCD34D'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
