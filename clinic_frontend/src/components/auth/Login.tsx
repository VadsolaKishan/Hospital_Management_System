import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Activity, User, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ButtonLoader } from '@/components/common/Loader';
import { toast } from '@/hooks/use-toast';

export const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [ekgPath, setEkgPath] = useState('');

    // Generate a dynamic EKG path (Green for light mode)
    useEffect(() => {
        const width = 2000;
        const height = 200;
        const baseline = height / 2;
        let path = `M 0 ${baseline}`;
        let x = 0;

        while (x < width) {
            x += Math.random() * 30 + 20;
            path += ` L ${x} ${baseline}`;
            const spikeHeight = Math.random() * 100 + 30;
            path += ` L ${x + 5} ${baseline - spikeHeight} L ${x + 10} ${baseline + spikeHeight * 0.6} L ${x + 15} ${baseline}`;
            x += 20;
        }
        setEkgPath(path);
    }, []);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await login(formData.email, formData.password);
            toast({
                title: 'Welcome Back!',
                description: 'Successfully logged in to HealthCare Pro.',
            });
            navigate('/dashboard');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: error.response?.data?.detail || 'Invalid credentials. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 text-slate-900 flex items-center justify-center font-sans selection:bg-emerald-100 selection:text-emerald-900">

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Soft Gradient Blobs */}
                <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-teal-100/50 rounded-full blur-[100px]" />

                {/* EKG Animation (Subtle Green) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <svg className="w-full h-64 overflow-visible" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="ekg-light" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="10%" stopColor="#10b981" />
                                <stop offset="90%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                        <path
                            d={ekgPath || "M0 100 L2000 100"}
                            stroke="url(#ekg-light)"
                            strokeWidth="2"
                            fill="none"
                            className="animate-ekg-scroll"
                        />
                    </svg>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-5 gap-12 p-6 items-center">
                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:col-span-2 flex-col justify-center space-y-8 animate-fade-in pl-8">
                    <div className="flex flex-col items-start justify-center space-y-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full" />
                            <div className="relative w-20 h-20 bg-white rounded-2xl border border-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-100/50">
                                <HeartPulse className="w-10 h-10 text-emerald-500" />
                            </div>
                        </div>

                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3 leading-tight">
                                Welcome <br />
                                <span className="text-emerald-600">Back</span>
                            </h1>
                            <p className="text-slate-600 text-lg max-w-sm mt-2 leading-relaxed font-medium">
                                Access your dashboard to manage appointments, patients, and medical records.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4 w-full">
                            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm border border-emerald-100/50 rounded-xl p-4 transition-all hover:bg-white hover:shadow-md group cursor-default">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                                    <User className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800">Quick Access</p>
                                    <p className="text-sm text-slate-500">Secure staff login</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm border border-emerald-100/50 rounded-xl p-4 transition-all hover:bg-white hover:shadow-md group cursor-default">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800">Encrypted</p>
                                    <p className="text-sm text-slate-500">End-to-end protection</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="lg:col-span-3 w-full max-w-xl mx-auto">
                    {/* Glass Card - Light version */}
                    <div className="relative backdrop-blur-xl bg-white/80 border border-white/60 rounded-[2rem] shadow-2xl shadow-emerald-900/5 p-8 md:p-10 overflow-hidden ring-1 ring-black/5">

                        <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                                <Activity className="h-5 w-5" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900">HealthCare Pro</h1>
                        </div>

                        <div className="mb-8 text-center lg:text-left">
                            <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
                            <p className="text-slate-500 mt-1 text-sm">Welcome back to HealthCare Pro</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="doctor@clinic.com"
                                        className={`w-full bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 pl-10 pr-4 py-3 outline-none text-sm font-medium transition-all shadow-sm ${errors.email ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-red-500 font-medium ml-1">{errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className={`w-full bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 pl-10 pr-10 py-3 outline-none text-sm font-medium transition-all shadow-sm ${errors.password ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-slate-400 hover:text-emerald-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-red-500 font-medium ml-1">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between text-sm pt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-colors"
                                    />
                                    <span className="text-slate-500 group-hover:text-emerald-600 transition-colors font-medium">
                                        Remember me
                                    </span>
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-emerald-600 hover:text-emerald-700 font-bold transition-all hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-[1px] shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.01] hover:shadow-emerald-500/40 mt-4"
                            >
                                <div className="relative h-full w-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3.5 transition-all">
                                    <span className="flex items-center justify-center gap-2 font-bold text-white tracking-wide">
                                        {isLoading ? <ButtonLoader className="text-white" /> : (
                                            <>
                                                Sign In
                                                <ArrowRight className="h-4 w-4 text-white" />
                                            </>
                                        )}
                                    </span>
                                </div>
                            </button>
                        </form>

                        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors hover:underline">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                /* Remove default password reveal on Edge/IE */
                input[type="password"]::-ms-reveal,
                input[type="password"]::-ms-clear {
                    display: none;
                }
                @keyframes ekg-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-ekg-scroll {
                    animation: ekg-scroll 20s linear infinite;
                }
            `}</style>
        </div>
    );
};
