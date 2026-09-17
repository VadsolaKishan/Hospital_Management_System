import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Activity, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { ButtonLoader } from '@/components/common/Loader';
import { toast } from '@/hooks/use-toast';

export const Login = () => {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
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
        const patternWidth = 1000;
        const height = 200;
        const baseline = height / 2;

        const segments = [];
        let x = 0;

        while (x < patternWidth) {
            x += Math.random() * 30 + 20;
            if (x >= patternWidth) break;
            segments.push({ type: 'L', x, y: baseline });

            const spikeHeight = Math.random() * 100 + 30;
            segments.push({ type: 'L', x: x + 5, y: baseline - spikeHeight });
            segments.push({ type: 'L', x: x + 10, y: baseline + spikeHeight * 0.6 });
            segments.push({ type: 'L', x: x + 15, y: baseline });
            x += 20;
        }

        let path = `M 0 ${baseline}`;

        // First copy
        for (const seg of segments) {
            path += ` L ${seg.x} ${seg.y}`;
        }
        path += ` L ${patternWidth} ${baseline}`;

        // Second copy
        for (const seg of segments) {
            path += ` L ${seg.x + patternWidth} ${seg.y}`;
        }
        path += ` L ${patternWidth * 2} ${baseline}`;

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
                description: 'Successfully logged in to Velora Care.',
            });
            navigate('/dashboard');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: error.response?.data?.detail || error.response?.data?.error || 'Invalid credentials. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (tokenResponse: any) => {
        setIsLoading(true);
        try {
            await googleLogin(tokenResponse.access_token);
            toast({
                title: 'Welcome Back!',
                description: 'Successfully logged in with Google.',
            });
            navigate('/dashboard');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Google Login Failed',
                description: error.response?.data?.error || 'Invalid credentials. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        prompt: 'select_account',
        onError: () => {
            toast({
                variant: 'destructive',
                title: 'Google Login Failed',
                description: 'Failed to authenticate with Google.',
            });
        }
    });

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-50/50 dark:bg-background text-foreground flex items-center justify-center font-sans selection:bg-primary/20 selection:text-primary">

            {/* Elegant Background Mesh Layer */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-primary/5 to-background pointer-events-none"></div>

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {/* Soft Premium Floating Blobs */}
                <div className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-primary/10 rounded-[100%] blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse-slow" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[800px] h-[800px] bg-secondary/10 rounded-[100%] blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse-slow" style={{ animationDelay: '2s' }} />

                {/* EKG Animation (Subtle Theme Color) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.10] dark:opacity-[0.40]">
                    <svg className="w-full h-64 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
                        <defs>
                            <linearGradient id="ekg-light" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="20%" stopColor="hsl(var(--primary))" />
                                <stop offset="80%" stopColor="hsl(var(--primary))" />
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

            <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-5 gap-8 lg:gap-12 p-4 sm:p-6 items-center">
                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:col-span-2 flex-col justify-center space-y-8 animate-fade-in pl-8">
                    <div className="flex flex-col items-start justify-center space-y-6">
                        <div className="flex flex-col items-start justify-center -ml-8">
                            <div className="flex items-center mb-2">
                                <img src="/logo.png" alt="Velora Care Logo" className="h-28 w-auto object-contain drop-shadow-md" />
                                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent -ml-4">Velora Care</h1>
                            </div>

                            <div className="ml-8">
                                <h2 className="text-4xl font-bold tracking-tight text-foreground mb-3 leading-tight">
                                    Welcome <br />
                                    <span className="text-primary">Back</span>
                                </h2>
                                <p className="text-muted-foreground text-lg max-w-sm mt-2 leading-relaxed font-medium">
                                    Access your dashboard to manage appointments, patients, and medical records.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 w-full">
                            <div className="flex items-center gap-4 bg-card/60 backdrop-blur-sm border border-primary/10 rounded-xl p-4 transition-all hover:bg-card hover:shadow-md group cursor-default">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                    <User className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-foreground">Quick Access</p>
                                    <p className="text-sm text-muted-foreground">Secure staff login</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-card/60 backdrop-blur-sm border border-secondary/10 rounded-xl p-4 transition-all hover:bg-card hover:shadow-md group cursor-default">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-foreground">Encrypted</p>
                                    <p className="text-sm text-muted-foreground">End-to-end protection</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="lg:col-span-3 w-full max-w-xl mx-auto">
                    {/* Glass Card - Light version */}
                    <div className="relative backdrop-blur-xl bg-card border border-border/60 rounded-[2rem] shadow-2xl shadow-primary/5 p-5 sm:p-8 md:p-10 overflow-hidden ring-1 ring-black/5">

                        <div className="lg:hidden flex items-center justify-center -ml-4 gap-1 mb-6 sm:mb-8">
                            <img src="/logo.png" alt="Velora Care Logo" className="h-[4.5rem] w-auto object-contain drop-shadow-md" />
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Velora Care</h1>
                        </div>

                        <div className="mb-6 sm:mb-8 text-center lg:text-left">
                            <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
                            <p className="text-muted-foreground mt-1 text-sm">Welcome back to Velora Care</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="doctor@clinic.com"
                                        className={`w-full bg-background border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground pl-10 pr-4 py-2.5 sm:py-3 outline-none text-sm font-medium transition-all shadow-sm ${errors.email ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-destructive font-medium ml-1">{errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className={`w-full bg-background border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground pl-10 pr-10 py-2.5 sm:py-3 outline-none text-sm font-medium transition-all shadow-sm ${errors.password ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors z-10"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-destructive font-medium ml-1">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between text-sm pt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-input text-primary focus:ring-primary transition-colors"
                                    />
                                    <span className="text-muted-foreground group-hover:text-primary transition-colors font-medium">
                                        Remember me
                                    </span>
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-primary hover:text-primary/80 font-bold transition-all hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary p-[1px] shadow-lg shadow-primary/30 transition-all hover:scale-[1.01] hover:shadow-primary/40 mt-4 group"
                            >
                                <div className="relative h-full w-full bg-gradient-to-r from-primary to-secondary px-4 py-2.5 sm:py-3.5 transition-all">
                                    <span className="flex items-center justify-center gap-2 font-bold text-white tracking-wide">
                                        {isLoading ? <ButtonLoader className="text-white" /> : (
                                            <>
                                                Sign In
                                                <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </div>
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative mt-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
                            </div>
                        </div>

                        {/* Google Login Button */}
                        <div className="mt-6">
                            <button
                                type="button"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 bg-card border border-input rounded-xl px-4 py-2.5 sm:py-3.5 text-sm font-bold text-foreground hover:bg-muted/50 transition-all shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                                onClick={() => handleGoogleLogin()}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                    <path d="M1 1h22v22H1z" fill="none" />
                                </svg>
                                Sign in with Google
                            </button>
                        </div>

                        <p className="mt-8 text-center text-sm text-muted-foreground font-medium">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary hover:text-primary/80 font-bold transition-colors hover:underline">
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
