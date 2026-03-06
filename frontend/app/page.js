'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ChefHat, TrendingUp, Utensils, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/auth/google-login`,
        { token: credentialResponse.credential }
      );

      const { token, user } = res.data;
      // Store token
      localStorage.setItem('token', token);

      // Redirect logic check (e.g., fetch if user has a restaurant registered)
      try {
        const restRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/restaurant/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (restRes.data.restaurant) {
          router.push('/dashboard');
        } else {
          router.push('/register-restaurant');
        }
      } catch (err) {
        // If 404, user doesn't have a restaurant yet
        if (err.response && err.response.status === 404) {
          router.push('/register-restaurant');
        } else {
          router.push('/dashboard');
        }
      }

    } catch (error) {
      console.error('Login failed', error);
      setErrorMsg('Login failed. Please verify your connection.');
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Login Failed');
    setErrorMsg('Google Login Failed.');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-orange-500/30">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/10">
        <div className="flex items-center gap-2">
          <ChefHat className="w-8 h-8 text-orange-500" />
          <span className="text-xl font-bold tracking-tight">PetPooja</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-neutral-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#about" className="hover:text-white transition">About us</a>
        </div>
        <div>
          <button className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:bg-neutral-200 transition shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center pt-32 pb-24 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span className="text-xs font-medium text-neutral-300">The next-gen restaurant OS</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Manage your restaurant <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            like a maestro.
          </span>
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-neutral-400 mb-12">
          Everything you need to run your food business smoothly. From ordering and billing to inventory and AI-driven insights, perfectly synced in real-time.
        </p>

        {/* Login Box */}
        <div className="bg-neutral-900 border border-white/10 p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col items-center justify-center relative backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-2">Welcome Back</h2>
          <p className="text-sm text-neutral-400 mb-8 text-center">Login or create an account to start managing your digital restaurant space.</p>

          {errorMsg && (
            <div className="w-full bg-red-500/10 border border-red-500/50 text-red-500 text-sm px-4 py-3 rounded-lg mb-6">
              {errorMsg}
            </div>
          )}

          <div className="w-full relative flex justify-center pb-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Securing your connection...</span>
              </div>
            ) : (
              <div className="scale-110">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Feature Section */}
      <section id="features" className="py-24 bg-neutral-950 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-orange-400" />}
              title="Real-time Analytics"
              desc="Monitor your daily sales, popular items, and customer retention metrics down to the minute."
            />
            <FeatureCard
              icon={<Utensils className="w-6 h-6 text-orange-400" />}
              title="Streamlined Menu"
              desc="Update prices, photos, and descriptions seamlessly. Push updates to digital menus instantly."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-orange-400" />}
              title="Secure Platform"
              desc="State of the art security to keep your financial data, customer data, and recipes safe."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition group cursor-default">
      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-neutral-400 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
