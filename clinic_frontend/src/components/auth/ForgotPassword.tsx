import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await authService.forgotPassword(email);
      setMessage('Password reset link has been sent to your email');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground flex items-center justify-center font-sans selection:bg-primary/20 selection:text-primary bg-[radial-gradient(hsl(var(--primary)/0.15)_1px,transparent_1px)] [background-size:16px_16px]">

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50 animate-pulse-slow" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto p-4 sm:p-6 items-center">
        {/* Glass Card */}
        <div className="relative backdrop-blur-xl bg-card border border-border/60 rounded-[2rem] shadow-2xl shadow-primary/5 p-6 sm:p-10 overflow-hidden ring-1 ring-black/5 animate-fade-in">

          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Reset Password
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {message && (
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                <p className="text-sm font-medium text-primary text-center">{message}</p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
                <p className="text-sm font-medium text-destructive text-center">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Email Address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full bg-background border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground px-4 py-3 outline-none text-sm font-medium transition-all shadow-sm"
                  placeholder="doctor@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary p-[1px] shadow-lg shadow-primary/30 transition-all hover:scale-[1.01] hover:shadow-primary/40 group mt-6"
            >
              <div className="relative h-full w-full bg-gradient-to-r from-primary to-secondary px-4 py-3 transition-all">
                <span className="flex items-center justify-center gap-2 font-bold text-white tracking-wide">
                  {loading ? 'Sending Request...' : 'Send Reset Link'}
                </span>
              </div>
            </button>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-primary hover:text-primary/80 font-bold transition-all hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
