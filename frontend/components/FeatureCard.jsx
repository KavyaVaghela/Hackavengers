export default function FeatureCard({ icon, title, description, badge, featured, featuredLabel, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`group relative text-left w-full p-8 rounded-2xl bg-white border shadow-sm transition-all duration-300 ease-in-out cursor-pointer flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(255,107,44,0.15)] ${featured
                ? 'border-[#FF9F43] hover:bg-[#FFF7ED] hover:border-[#FF6B2C]'
                : 'border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
        >
            {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold py-1 px-4 bg-gradient-to-r from-[#FF6B2C] to-[#FF9F43] text-white rounded-full whitespace-nowrap shadow-[0_4px_12px_rgba(255,107,44,0.4)]">
                    {featuredLabel || "Featured"}
                </span>
            )}
            <div className="text-4xl mb-5">{icon}</div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h3 className="text-base font-semibold text-slate-900 m-0 leading-tight">
                    {title}
                </h3>
                {badge && (
                    <span
                        className={`text-[11px] font-semibold py-1 px-3 rounded-full ${featured
                            ? 'bg-[#FF6B2C]/10 text-[#FF6B2C]'
                            : 'bg-slate-100 text-slate-600'
                            }`}
                    >
                        {badge}
                    </span>
                )}
            </div>

            <p className="text-[13px] text-slate-500 leading-relaxed m-0 flex-grow">
                {description}
            </p>
        </button>
    );
}
