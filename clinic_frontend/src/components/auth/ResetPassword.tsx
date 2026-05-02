import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid reset link');
        setVerifying(false);
        return;
      }

      try {
        await authService.verifyResetToken(token);
        setVerifying(false);
      } catch (err: any) {
        console.error('Token verification error:', err);
        const errorMsg =
          err.response?.data?.errors?.token?.[0] ||
          err.response?.data?.error ||
          err.message ||
          'Invalid or expired token';
        setError(errorMsg);
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!token) {
      setError('Invalid reset link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(token, password, confirmPassword);
      setMessage('Password has been reset successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.errors?.token?.[0] || err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground bg-[radial-gradient(hsl(var(--primary)/0.15)_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-50 animate-pulse-slow" />
        </div>
        <div className="text-center max-w-md w-full relative z-10 backdrop-blur-xl bg-card border border-border/60 rounded-[2rem] shadow-2xl shadow-primary/5 p-8">
          {error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5">
              <p className="text-sm font-medium text-destructive mb-4">{error}</p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-destructive hover:text-destructive/80 font-bold transition-all hover:underline mb-4 block w-full"
              >
                Request a new reset link
              </button>
              <div className="mt-2 pt-4 border-t border-destructive/10">
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-primary hover:text-primary/80 font-bold transition-all hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-6"></div>
              <p className="text-muted-foreground font-medium">Verifying reset link securely...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

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
              Create New Password
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Enter your new secure password below to regain access to Velora Care.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 mb-6">
              <p className="text-sm font-medium text-destructive text-center">{error}</p>
              {error === 'Invalid or expired token' && (
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="mt-3 text-sm text-destructive hover:text-destructive/80 font-bold transition-all hover:underline text-center w-full"
                >
                  Request a new reset link
                </button>
              )}
            </div>
          )}

          {!error && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {message && (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                  <p className="text-sm font-medium text-primary text-center">{message}</p>
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    New Password
                  </label>
                  <div className="relative group">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="w-full bg-background border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground px-4 py-3 outline-none text-sm font-medium transition-all shadow-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      className="w-full bg-background border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground px-4 py-3 outline-none text-sm font-medium transition-all shadow-sm"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs font-medium text-muted-foreground/80 ml-1">
                Password must be at least 8 characters long
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary p-[1px] shadow-lg shadow-primary/30 transition-all hover:scale-[1.01] hover:shadow-primary/40 group mt-6"
              >
                <div className="relative h-full w-full bg-gradient-to-r from-primary to-secondary px-4 py-3 transition-all">
                  <span className="flex items-center justify-center gap-2 font-bold text-white tracking-wide">
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                  </span>
                </div>
              </button>

              <div className="mt-8 text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-primary hover:text-primary/80 font-bold transition-all hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
