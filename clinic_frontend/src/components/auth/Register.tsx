import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, Activity, ChevronDown, ArrowRight, HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ButtonLoader } from '@/components/common/Loader';
import { toast } from '@/hooks/use-toast';
import { ROLES, ROLE_LABELS } from '@/utils/constants';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'PATIENT',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ekgPath, setEkgPath] = useState('');

  // Generate a dynamic EKG path (Green for light mode)
  useEffect(() => {
    const patternWidth = 1000;
    const height = 200;
    const baseline = height / 2;

    let segments = [];
    let x = 0;

    while (x < patternWidth) {
      x += Math.random() * 30 + 20;
      if (x >= patternWidth) break;
      segments.push({ type: 'L', x, y: baseline });

      const spikeHeight = Math.random() * 100 + 30; // Slightly shorter spikes for cleaner look
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
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(formData);
      toast({
        title: 'Account Created!',
        description: 'Welcome to Velora Care. Your account has been created successfully.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.response?.data?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const allowedRoles = [ROLES.PATIENT, ROLES.DOCTOR];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50/50 dark:bg-background text-foreground flex items-center justify-center font-sans selection:bg-primary/20 selection:text-primary">

      {/* Elegant Background Mesh Layer */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-primary/5 to-background pointer-events-none"></div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft Premium Floating Blobs */}
        <div className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-primary/10 rounded-[100%] blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse-slow" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[800px] h-[800px] bg-secondary/10 rounded-[100%] blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-accent/10 rounded-[100%] blur-[80px] mix-blend-multiply dark:mix-blend-screen opacity-50 animate-pulse-slow" style={{ animationDelay: '4s' }} />

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
          <div className="flex flex-col items-start justify-center">
            <div className="relative group -mb-2 -ml-2">
              <img src="/logo.png" alt="Velora Care Logo" className="h-28 w-auto object-contain drop-shadow-md" />
            </div>

            <div className="mt-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3 leading-tight">
                Join <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Velora Care</span> <br />
                <span className="text-2xl font-normal text-muted-foreground">Advanced Medical Care</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-sm mt-2 leading-relaxed font-medium">
                Secure patient records, instant appointments, and AI-powered diagnostics.
              </p>
            </div>

            <div className="space-y-4 pt-8 w-full">
              <div className="flex items-center gap-4 bg-card/60 backdrop-blur-sm border border-primary/10 rounded-xl p-4 transition-all hover:bg-card hover:shadow-md group cursor-default">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">Expert Care</p>
                  <p className="text-sm text-muted-foreground">Connect with top specialists</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-card/60 backdrop-blur-sm border border-secondary/10 rounded-xl p-4 transition-all hover:bg-card hover:shadow-md group cursor-default">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">Secure Records</p>
                  <p className="text-sm text-muted-foreground">HIPAA Compliant & Encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:col-span-3 w-full max-w-xl mx-auto">
          {/* Glass Card - Light version */}
          <div className="relative backdrop-blur-xl bg-card border border-border/60 rounded-[2rem] shadow-2xl shadow-primary/5 p-5 sm:p-8 md:p-10 overflow-hidden ring-1 ring-black/5">

            <div className="mb-6 sm:mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
              <p className="text-muted-foreground mt-1 text-sm bg-muted inline-block px-3 py-1 rounded-full border border-border">
                Get started with your free account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">First Name</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full bg-background border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground pl-10 pr-4 py-2.5 sm:py-3 outline-none text-sm font-medium transition-all shadow-sm"
                      placeholder="John"
                    />
                  </div>
                  {errors.first_name && <p className="text-xs text-destructive font-medium ml-1">{errors.first_name}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-background border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground px-4 py-2.5 sm:py-3 outline-none text-sm font-medium transition-all shadow-sm"
                    placeholder="Doe"
                  />
                  {errors.last_name && <p className="text-xs text-destructive font-medium ml-1">{errors.last_name}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-background border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground pl-10 pr-4 py-2.5 sm:py-3 outline-none text-sm font-medium transition-all shadow-sm"
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive font-medium ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone</label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-background border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground pl-10 pr-4 py-2.5 sm:py-3 outline-none text-sm font-medium transition-all shadow-sm"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                {errors.phone && <p className="text-xs text-destructive font-medium ml-1">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Account Type</label>
                <div className="relative">
                  <div className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 sm:py-3 text-muted-foreground text-sm font-medium shadow-sm">
                    Patient
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-background border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground pl-10 pr-10 py-2.5 sm:py-3 outline-none text-sm font-medium transition-all shadow-sm"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors z-10">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive font-medium ml-1">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Confirm</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      className="w-full bg-background border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground pl-10 pr-10 py-2.5 sm:py-3 outline-none text-sm font-medium transition-all shadow-sm"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors z-10">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="text-xs text-destructive font-medium ml-1">{errors.confirm_password}</p>}
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <div className="relative flex items-center h-5">
                  <input
                    type="checkbox"
                    required
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary transition-colors"
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:text-primary/80 font-semibold hover:underline border-b border-transparent">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary hover:text-primary/80 font-semibold hover:underline border-b border-transparent">
                    Privacy Policy
                  </Link>
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary p-[1px] shadow-lg shadow-primary/30 transition-all hover:scale-[1.01] hover:shadow-primary/40 mt-2 group"
              >
                <div className="relative h-full w-full bg-gradient-to-r from-primary to-secondary px-4 py-2.5 sm:py-3.5 transition-all">
                  <div className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <ButtonLoader className="text-white" />
                    ) : (
                      <>
                        <span className="font-bold text-white tracking-wide">Create Account</span>
                        <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </div>
              </button>

            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 font-bold transition-colors hover:underline">
                Sign In
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


