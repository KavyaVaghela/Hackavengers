'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, Search, Bell } from 'lucide-react';

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
        } else {
            setLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    if (loading) {
        return <div className="min-h-screen bg-neutral-950" />;
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex">
            {/* Sidebar sidebar */}
            <aside className="w-64 border-r border-white/10 flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <span className="font-bold text-lg tracking-tight flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-xs">P</span>
                        PetPooja OS
                    </span>
                </div>

                <div className="p-4 flex-1">
                    <nav className="space-y-1">
                        <a href="#" className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg text-orange-400 font-medium border border-white/5">
                            <LayoutDashboard className="w-4 h-4" />
                            Overview
                        </a>
                    </nav>
                </div>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition w-full text-left"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-8">
                    <div className="flex items-center gap-4 text-neutral-400">
                        <Search className="w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            className="bg-transparent border-none focus:outline-none text-sm w-64 placeholder:text-neutral-600 text-white"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-neutral-400 hover:text-white transition relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full border border-neutral-950"></span>
                        </button>
                    </div>
                </header>

                <div className="p-8 flex-1 flex flex-col items-center justify-center relative">
                    {/* Background glow for aesthetics */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

                    <div className="text-center">
                        <div className="w-20 h-20 bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <LayoutDashboard className="w-10 h-10 text-orange-500" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4 tracking-tight">Welcome to PetPooja Dashboard</h1>
                        <p className="text-neutral-400 max-w-md mx-auto">
                            Your restaurant's central nervous system is officially online. Phase 2 features (Menu, Ordering, Billing) will appear here.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
