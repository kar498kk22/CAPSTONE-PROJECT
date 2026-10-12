import React, { useState } from 'react';
import { User, AuthSession } from '../types';
import { signInWithGoogle } from '../lib/firebase';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  X,
  Shield,
  ArrowRight,
  Sparkles,
  Loader2,
  Building
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (session: AuthSession) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'claimant' | 'adjuster'>('claimant');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Detect identifier type in real-time
  const getIdentifierType = (input: string): 'email' | 'phone' | 'invalid' => {
    const trimmed = input.trim();
    if (!trimmed) return 'invalid';
    if (trimmed.includes('@') && trimmed.includes('.')) return 'email';
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 10) return 'phone';
    return 'invalid';
  };

  const idType = getIdentifierType(username);

  // Password validation: must be at least 8 characters
  const isPasswordValid = password.length >= 8;

  // Calculate password strength
  const getPasswordStrength = () => {
    if (password.length === 0) return { label: '', color: '', percent: 0 };
    if (password.length < 8) return { label: 'Too short (min 8 characters)', color: 'text-red-400 bg-red-500', percent: 25 };
    let score = 1;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score === 1) return { label: 'Fair (add uppercase/numbers)', color: 'text-amber-400 bg-amber-500', percent: 50 };
    if (score === 2) return { label: 'Good (8+ chars)', color: 'text-blue-400 bg-blue-500', percent: 75 };
    return { label: 'Strong & Secure', color: 'text-emerald-400 bg-emerald-500', percent: 100 };
  };

  const strength = getPasswordStrength();

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (idType === 'invalid') {
      setError('Please enter a valid Gmail / Email address (e.g. name@gmail.com) or a 10-digit mobile number.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const bodyPayload =
        mode === 'register'
          ? { name: name.trim(), username: username.trim(), password, role }
          : { username: username.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Authentication failed. Please verify credentials.');
        return;
      }

      // Success
      onAuthSuccess({
        user: data.user,
        token: data.token,
      });
      onClose();
    } catch (err: any) {
      setError('Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-in with Firebase Auth
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      const user: User = {
        id: fbUser.uid,
        name: fbUser.displayName || 'Google User',
        username: fbUser.email || 'google.user@gmail.com',
        identifierType: 'email',
        email: fbUser.email || undefined,
        role: fbUser.email === 'karthikeyachirala@gmail.com' ? 'adjuster' : 'claimant',
        createdAt: new Date().toISOString(),
      };
      onAuthSuccess({
        user,
        token: `firebase-${fbUser.uid}-${Date.now()}`,
      });
      onClose();
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError(err?.message || 'Google Sign-in was cancelled or failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo 1-Click quick login
  const handleQuickLogin = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'login' ? 'Sign In to ClaimFlow' : 'Create ClaimFlow Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'login'
                  ? 'Access your claims, document reviews & instant payouts'
                  : 'Register with Gmail or mobile number (min 8-char password)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              New User? Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Firebase Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google (Firebase Auth)</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-mono">OR USE USERNAME & PASSWORD</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Full Name (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Username: Gmail/Email or Mobile Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Username (Gmail or Mobile Number)
              </label>
              {username && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border">
                  {idType === 'email' ? (
                    <span className="text-emerald-400 border-emerald-800/80 bg-emerald-950/50">
                      📧 Email Verified
                    </span>
                  ) : idType === 'phone' ? (
                    <span className="text-blue-400 border-blue-800/80 bg-blue-950/50">
                      📱 Mobile Number
                    </span>
                  ) : (
                    <span className="text-amber-400 border-amber-800/80 bg-amber-950/50">
                      Enter email or 10-digit phone
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              {idType === 'phone' ? (
                <Phone className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
              ) : (
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              )}
              <input
                type="text"
                placeholder="e.g. sarah.jenkins@gmail.com or 555-349-8812"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Password (must be >= 8 characters) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Password <span className="text-slate-400 font-normal">(Min. 8 characters)</span>
              </label>
              <span
                className={`text-[10px] font-mono font-bold ${
                  password.length >= 8 ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {password.length}/8 chars
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter at least 8 characters..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-1.5 space-y-1">
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={strength.color.split(' ')[0]}>{strength.label}</span>
                  {password.length >= 8 && (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Requirement met
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your 8+ character password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>
            </div>
          )}

          {/* Account Role Selector (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRole('claimant')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === 'claimant'
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold block text-white">Policyholder</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    File claims & get instant payouts
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('adjuster')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === 'adjuster'
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold block text-white">Claims Adjuster</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Review & authorize settlements
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || idType === 'invalid'}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-950 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Create Account & Log In</span>
              </>
            )}
          </button>

          {/* Quick Demo Credentials Helper */}
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              ⚡ Quick 1-Click Demo Accounts:
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('sarah.jenkins@gmail.com', 'Password123!')}
                className="w-full text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 transition-all flex items-center justify-between text-[11px]"
              >
                <div>
                  <span className="font-semibold text-white">Sarah Jenkins</span>
                  <span className="text-slate-400 ml-1.5 font-mono">sarah.jenkins@gmail.com</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                  Gmail Login
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('5557829014', 'Password123!')}
                className="w-full text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 transition-all flex items-center justify-between text-[11px]"
              >
                <div>
                  <span className="font-semibold text-white">David Zhang</span>
                  <span className="text-slate-400 ml-1.5 font-mono">555-782-9014</span>
                </div>
                <span className="text-[10px] text-blue-400 font-semibold bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-800">
                  Mobile Login
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('marcus.vance@claimflow.com', 'Password123!')}
                className="w-full text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 transition-all flex items-center justify-between text-[11px]"
              >
                <div>
                  <span className="font-semibold text-white">Marcus Vance</span>
                  <span className="text-slate-400 ml-1.5 font-mono">marcus.vance@claimflow.com</span>
                </div>
                <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-800">
                  Adjuster Desk
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
