'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Store, User, FileText, Mail, Phone, MapPin, Loader2 } from 'lucide-react';

export default function RegisterRestaurant() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        restaurantName: '',
        ownerName: '',
        gstNumber: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
        } else {
            // eslint-disable-next-line
            setCheckingAuth(false);
        }
    }, [router]);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/restaurant/register`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            setErrorMsg(error.response?.data?.error || 'Registration failed. Please try again.');
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex items-center justify-center p-6 selection:bg-orange-500/30">
            <div className="max-w-xl w-full">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold mb-2">Setup Your Restaurant</h1>
                    <p className="text-neutral-400 text-sm">Fill in the details below to activate your PetPooja OS dashboard.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-neutral-900 border border-white/10 p-8 rounded-2xl shadow-xl flex flex-col gap-5">
                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center">
                            {errorMsg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField
                            icon={<Store />}
                            label="Restaurant Name"
                            name="restaurantName"
                            value={formData.restaurantName}
                            onChange={handleChange}
                            placeholder="The Great Cafe"
                        />
                        <InputField
                            icon={<User />}
                            label="Owner Name"
                            name="ownerName"
                            value={formData.ownerName}
                            onChange={handleChange}
                            placeholder="John Doe"
                        />
                        <InputField
                            icon={<FileText />}
                            label="GST Number"
                            name="gstNumber"
                            value={formData.gstNumber}
                            onChange={handleChange}
                            placeholder="22AAAAA0000A1Z5"
                        />
                        <InputField
                            icon={<Mail />}
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="contact@cafe.com"
                        />
                        <InputField
                            icon={<Phone />}
                            label="Phone Number"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 99999 99999"
                        />
                    </div>

                    <div className="w-full">
                        <label className="block text-xs font-semibold text-neutral-400 mb-2 ml-1 uppercase tracking-wider">Restaurant Address</label>
                        <div className="relative flex items-start">
                            <div className="absolute top-3 left-4 text-neutral-500">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <textarea
                                name="address"
                                required
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="123 Food Street, Culinary District..."
                                className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition resize-none h-24"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Registration'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function InputField({ icon, label, name, value, onChange, placeholder, type = "text" }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2 ml-1 uppercase tracking-wider">{label}</label>
            <div className="relative flex items-center">
                <div className="absolute left-4 text-neutral-500 [&>svg]:w-5 [&>svg]:h-5">
                    {icon}
                </div>
                <input
                    type={type}
                    name={name}
                    required
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                />
            </div>
        </div>
    );
}
