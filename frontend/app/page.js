'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  ChefHat, TrendingUp, Utensils, Phone, Stethoscope,
  ReceiptText, Sparkles, ArrowRight, CheckCircle
} from 'lucide-react';
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
      const { token } = res.data;
      localStorage.setItem('token', token);
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
    setErrorMsg('Google Login failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B2C] to-[#FF9F43] rounded-lg flex items-center justify-center shadow-sm shadow-orange-200">
              <ChefHat className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="text-xl font-extrabold text-[#0F172A] tracking-tight">PetPooja</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#64748B]">
            <a href="#features" className="hover:text-[#0F172A] transition-colors">Features</a>
            <a href="#about" className="hover:text-[#0F172A] transition-colors">About</a>
          </div>

          {/* CTA */}
          <a href="#login">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#FF6B2C] hover:bg-[#ea580c] text-white text-sm font-bold rounded-full transition-colors shadow-sm shadow-orange-200">
              Get Started <ArrowRight size={14} />
            </button>
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-20 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left: copy */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#FF6B2C] animate-pulse"></span>
              <span className="text-xs font-bold text-[#FF6B2C] uppercase tracking-wider">AI-Powered Restaurant OS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] leading-tight tracking-tight mb-6">
              Run your restaurant{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF9F43]">
                smarter with PetPooja AI
              </span>
            </h1>

            <p className="text-lg text-[#64748B] leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Automate orders, billing, insights, and menu intelligence — all in one powerful restaurant operating system built for modern restaurants.
            </p>

            {/* Proof points */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm font-medium text-[#64748B]">
              {['AI Voice Ordering', 'Menu Doctor AI', 'Real-time Insights', 'Smart Billing'].map(f => (
                <div key={f} className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-[#FF6B2C]" /> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login Card */}
          <div id="login" className="w-full max-w-md flex-shrink-0">
            <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-xl shadow-slate-200/60 p-8">
              {/* Card header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B2C] to-[#FF9F43] rounded-xl flex items-center justify-center">
                  <ChefHat size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F172A]">Welcome back to PetPooja</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">Sign in to access your restaurant dashboard</p>
                </div>
              </div>

              <div className="h-px bg-[#E2E8F0] mb-6" />

              {/* Error */}
              {errorMsg && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Google Login */}
              <div className="flex justify-center">
                {loading ? (
                  <div className="flex items-center gap-2.5 py-3 px-6 bg-slate-50 border border-[#E2E8F0] rounded-full text-sm font-semibold text-[#64748B]">
                    <div className="w-4 h-4 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin"></div>
                    Securing your connection…
                  </div>
                ) : (
                  <div className="transform scale-110">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="outline"
                      shape="pill"
                      size="large"
                      text="signin_with"
                    />
                  </div>
                )}
              </div>

              <p className="text-xs text-center text-[#94A3B8] mt-6">
                By signing in, you agree to our{' '}
                <span className="underline cursor-pointer hover:text-[#FF6B2C] transition-colors">Terms of Service</span>
                {' '}and{' '}
                <span className="underline cursor-pointer hover:text-[#FF6B2C] transition-colors">Privacy Policy</span>.
              </p>
            </div>

            {/* Testimonial / trust chip */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#64748B]">
              <div className="flex -space-x-1.5">
                {['🧑‍🍳', '👩‍💼', '👨‍🍽️'].map((e, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-orange-50 border border-white flex items-center justify-center text-[10px]">{e}</div>
                ))}
              </div>
              <span>Trusted by <strong className="text-[#0F172A]">500+</strong> restaurant owners</span>
            </div>
          </div>

        </div>
      </main>

      {/* ── Features ── */}
      <section id="features" className="bg-white border-t border-[#E2E8F0] py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 mb-4">
              <Sparkles size={12} className="text-[#FF6B2C]" />
              <span className="text-xs font-bold text-[#FF6B2C] uppercase tracking-wider">Platform Modules</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mb-4">Everything your restaurant needs</h2>
            <p className="text-[#64748B] max-w-xl mx-auto leading-relaxed">
              PetPooja connects all your restaurant operations in a single seamless platform — from voice ordering to data insights.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Phone size={20} className="text-[#FF6B2C]" />}
              title="AI Call Ordering"
              desc="Customers place orders via voice call. Our AI transcribes, matches your menu, and places the order automatically."
              color="orange"
            />
            <FeatureCard
              icon={<Stethoscope size={20} className="text-[#FF6B2C]" />}
              title="Menu Doctor AI"
              desc="Analyse your menu health, identify underperforming dishes and get AI-generated improvement recommendations."
              color="orange"
            />
            <FeatureCard
              icon={<TrendingUp size={20} className="text-[#FF6B2C]" />}
              title="Business Insights"
              desc="Real-time analytics on revenue, orders, and item popularity. Export reports with a single click."
              color="orange"
            />
            <FeatureCard
              icon={<ReceiptText size={20} className="text-[#FF6B2C]" />}
              title="Smart Billing"
              desc="Generate itemised bills and PDF invoices instantly. Support for multiple payment methods built in."
              color="orange"
            />
            <FeatureCard
              icon={<Utensils size={20} className="text-[#FF6B2C]" />}
              title="Menu Management"
              desc="Add, update, and organise your menu items with categories, prices, and availability toggles."
              color="orange"
            />
            <FeatureCard
              icon={<Sparkles size={20} className="text-[#FF6B2C]" />}
              title="CSV Data Import"
              desc="Bulk import your existing menu and order data from spreadsheets to get started in minutes."
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat size={16} className="text-[#FF6B2C]" />
            <span className="text-sm font-bold text-[#0F172A]">PetPooja</span>
            <span className="text-sm text-[#94A3B8]">— Restaurant OS</span>
          </div>
          <p className="text-xs text-[#94A3B8]">© {new Date().getFullYear()} PetPooja. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="group p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#FFF7ED] hover:border-orange-100 transition-all cursor-default">
      <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-orange-100 transition-all">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#0F172A] mb-2">{title}</h3>
      <p className="text-sm text-[#64748B] leading-relaxed">{desc}</p>
    </div>
  );
}
