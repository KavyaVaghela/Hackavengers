'use client';
import { ShoppingBag } from 'lucide-react';

/**
 * DetectedItems — shows fuzzy-matched menu items as cards
 */
export default function DetectedItems({ items }) {
    if (!items || items.length === 0) return null;

    return (
        <div>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ShoppingBag size={13} /> Detected Items
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{item.item_name} &times; {item.quantity}</p>
                            <p className="text-xs text-slate-500 font-medium capitalize">{item.category || item.menu_type || 'Item'}</p>
                        </div>
                        <span className="font-extrabold text-[#FF6B2C] text-sm">
                            &#8377;{(item.price * item.quantity).toFixed(0)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
