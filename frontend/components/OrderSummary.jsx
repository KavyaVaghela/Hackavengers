'use client';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * OrderSummary — final order table before the customer confirms
 */
export default function OrderSummary({ items, onConfirm, onCancel, isPending }) {
    if (!items || items.length === 0) return null;
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

    return (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-5">
            <h3 className="text-base font-extrabold text-[#0F172A] mb-4 text-center">📋 Order Summary</h3>

            <div className="space-y-2 mb-4">
                {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                        <span className="font-semibold text-slate-700">{item.quantity} &times; {item.item_name}</span>
                        <span className="font-bold text-slate-800">&#8377;{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                ))}
                <div className="flex justify-between text-base pt-3 border-t border-slate-300 mt-2">
                    <span className="font-extrabold text-slate-900">Total</span>
                    <span className="font-black text-[#FF6B2C]">&#8377;{total.toFixed(0)}</span>
                </div>
            </div>

            <div className="flex gap-3 mt-5">
                <button
                    onClick={onCancel}
                    disabled={isPending}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                    <XCircle size={15} /> Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isPending}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition shadow-sm shadow-emerald-300/40 flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                    <CheckCircle size={15} />
                    {isPending ? 'Placing…' : 'Confirm Order'}
                </button>
            </div>
        </div>
    );
}
