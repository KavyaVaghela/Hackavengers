export default function FeatureCard({ icon, title, description, badge, featured, featuredLabel }) {
    return (
        <button
            className="group relative text-left w-full p-8 rounded-2xl bg-[#1E293B] border border-[#334155] shadow-sm hover:-translate-y-1 hover:bg-[#273449] hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer flex flex-col h-full"
        >
            {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold py-1 px-4 bg-[#ea580c] text-white rounded-full whitespace-nowrap shadow-[0_4px_12px_rgba(234,88,12,0.3)]">
                    {featuredLabel || "Featured"}
                </span>
            )}
            <div className="text-4xl mb-5">{icon}</div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h3 className="text-base font-semibold text-white m-0 leading-tight">
                    {title}
                </h3>
                {badge && (
                    <span
                        className="text-[11px] font-semibold py-1 px-3 rounded-full bg-[#334155] text-[#e2e8f0]"
                    >
                        {badge}
                    </span>
                )}
            </div>

            <p className="text-[13px] text-slate-400 leading-relaxed m-0 flex-grow">
                {description}
            </p>
        </button>
    );
}
