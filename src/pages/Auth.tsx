import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

export default function Auth({ mode: initialMode }: { mode: 'login' | 'register' }) {
  const { login, navigateTo, showToast } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Form controls
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Validate password rules: Min 8, uppercase, lowercase, number, special char
  const validatePassword = (pass: string): boolean => {
    if (pass.length < 8) return false;
    if (!/[A-Z]/.test(pass)) return false;
    if (!/[a-z]/.test(pass)) return false;
    if (!/[0-9]/.test(pass)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return false;
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user, data.merchantCode);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !regEmail || !regPhone || !regPassword || !confirmPassword) {
      setError('Please fill in all requested registration fields.');
      return;
    }

    if (regPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!validatePassword(regPassword)) {
      setError('Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character (e.g. Password123!).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: regEmail,
          phone: regPhone,
          password: regPassword
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      showToast('Account registered successfully! Please log in.', 'success');
      setMode('login');
      setLoginEmail(regEmail);
      setLoginPassword('');
    } catch (err: any) {
      setError(err.message || 'Registration failure.');
    } finally {
      setLoading(false);
    }
  };

  // Quick helper to fill credentials for testing
  const autofill = (type: 'admin' | 'merchant') => {
    setError(null);
    setMode('login');
    if (type === 'admin') {
      setLoginEmail('admin@payhub.co.ke');
      setLoginPassword('admin123');
    } else {
      setLoginEmail('merchant@payhub.co.ke');
      setLoginPassword('merchant123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        {/* Brand logo */}
        <div 
          onClick={() => navigateTo('/')}
          className="mx-auto bg-green-600 text-white p-3 rounded-2xl font-black text-2xl flex items-center justify-center w-14 h-14 cursor-pointer shadow-lg shadow-green-950/20"
        >
          PH
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {mode === 'login' ? 'Sign in to PayHub' : 'Create merchant account'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Multi-Tenant Direct Settlement Payment Solutions
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/60 space-y-6">
          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded text-xs text-red-200 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4" id="login-form">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. merchant@payhub.co.ke" 
                  className="w-full text-sm border border-slate-700 rounded-lg p-3 bg-slate-900/60 text-white outline-none focus:border-green-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <span className="text-[10px] text-slate-500 cursor-not-allowed">Forgot Password?</span>
                </div>
                <div className="relative">
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full text-sm border border-slate-700 rounded-lg p-3 pr-10 bg-slate-900/60 text-white outline-none focus:border-green-500 transition-colors"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4" id="register-form">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nelly" 
                    className="w-full text-sm border border-slate-700 rounded-lg p-3 bg-slate-900/60 text-white outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Mutua" 
                    className="w-full text-sm border border-slate-700 rounded-lg p-3 bg-slate-900/60 text-white outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text" 
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="e.g. 0712345678" 
                  className="w-full text-sm border border-slate-700 rounded-lg p-3 bg-slate-900/60 text-white outline-none focus:border-green-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. nelly@abcelectronics.co.ke" 
                  className="w-full text-sm border border-slate-700 rounded-lg p-3 bg-slate-900/60 text-white outline-none focus:border-green-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="e.g. Password123!" 
                  className="w-full text-sm border border-slate-700 rounded-lg p-3 bg-slate-900/60 text-white outline-none focus:border-green-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password" 
                  className="w-full text-sm border border-slate-700 rounded-lg p-3 bg-slate-900/60 text-white outline-none focus:border-green-500 transition-colors"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1"
              >
                {loading ? 'Creating Account...' : 'Sign Up & Create Business'}
              </button>
            </form>
          )}

          {/* Quick Sandbox Demos */}
          <div className="border-t border-slate-700/60 pt-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">
              ⚡ Sandbox Autofill Testing Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => autofill('merchant')}
                className="bg-slate-900/80 hover:bg-slate-900 text-green-400 border border-slate-700 text-[11px] font-bold py-2 px-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                <Sparkles size={12} />
                Demo Merchant
              </button>
              <button 
                onClick={() => autofill('admin')}
                className="bg-slate-900/80 hover:bg-slate-900 text-blue-400 border border-slate-700 text-[11px] font-bold py-2 px-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                <Sparkles size={12} />
                Demo Admin
              </button>
            </div>
          </div>

          <div className="text-center">
            {mode === 'login' ? (
              <p className="text-xs text-slate-400">
                New to PayHub Kenya?{' '}
                <button 
                  onClick={() => { setError(null); setMode('register'); }}
                  className="text-green-400 hover:text-green-300 font-bold underline"
                  id="link-go-register"
                >
                  Register Business
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Already have a merchant account?{' '}
                <button 
                  onClick={() => { setError(null); setMode('login'); }}
                  className="text-green-400 hover:text-green-300 font-bold underline"
                  id="link-go-login"
                >
                  Sign In Instead
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center max-w-sm mx-auto flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
        <Shield size={14} className="text-green-600" />
        <span>Direct Settlement Model: PIN is never requested on-screen.</span>
      </div>
    </div>
  );
}
