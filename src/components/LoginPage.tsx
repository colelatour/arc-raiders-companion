import React, { useState } from 'react';
import { Shield, Terminal, AlertTriangle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setShowResendVerification(false);
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (username.length < 3) {
          setError('Username must be at least 3 characters');
          setIsLoading(false);
          return;
        }
        // Register the user but don't auto-login
        await register(email, username, password);
        
        // Show success message
        setSuccessMessage('✅ Registration successful! Please check your email to verify your account.');
        setPassword('');
        setUsername('');
      }
      setIsLoading(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Authentication failed';
      setError(errorMsg);
      
      // Show resend verification option if email not verified
      if (errorMsg.includes('verify your email')) {
        setShowResendVerification(true);
      }
      
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      setSuccessMessage('✅ Verification email sent! Please check your inbox.');
      setShowResendVerification(false);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-arc-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 animate-pulse">
          <Terminal size={200} />
        </div>
        <div className="absolute bottom-10 right-10 animate-pulse delay-1000">
          <Shield size={150} />
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block p-4 bg-arc-800 rounded-full border-2 border-arc-accent mb-4 shadow-lg shadow-red-900/30">
            <Shield size={48} className="text-arc-accent" />
          </div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">
            ARC <span className="text-arc-accent">RAIDERS</span>
          </h1>
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Terminal size={14} className="animate-pulse" />
            <p className="text-sm font-mono uppercase tracking-widest">Companion Database</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-arc-800 rounded-xl border border-arc-700 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 bg-arc-900/50 border-b border-arc-700">
            <button
              onClick={() => {setIsLogin(true); setError('');}}
              className={`py-4 font-bold uppercase text-sm tracking-wider transition-all ${
                isLogin 
                  ? 'bg-arc-800 text-arc-accent border-b-2 border-arc-accent' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {setIsLogin(false); setError('');}}
              className={`py-4 font-bold uppercase text-sm tracking-wider transition-all ${
                !isLogin 
                  ? 'bg-arc-800 text-arc-accent border-b-2 border-arc-accent' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-900/20 border-red-700 border rounded-lg p-4 flex items-start space-x-3 animate-fade-in">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-900/20 border-green-700 border rounded-lg p-4 flex items-start space-x-3 animate-fade-in">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-300 text-sm">{successMessage}</p>
              </div>
            )}

            {showResendVerification && (
              <div className="bg-blue-900/20 border-blue-700 border rounded-lg p-4 animate-fade-in">
                <p className="text-blue-300 text-sm mb-3">Haven't received the verification email?</p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Resend Verification Email
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-arc-900 text-white px-4 py-3 rounded-lg border border-arc-700 focus:border-arc-accent focus:outline-none transition-colors"
                placeholder="raider@arc.com"
              />
            </div>

            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  className="w-full bg-arc-900 text-white px-4 py-3 rounded-lg border border-arc-700 focus:border-arc-accent focus:outline-none transition-colors"
                  placeholder="RaiderName"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-arc-900 text-white px-4 py-3 rounded-lg border border-arc-700 focus:border-arc-accent focus:outline-none transition-colors"
                placeholder="••••••••"
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-2">Minimum 6 characters required</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-arc-accent hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg uppercase tracking-wider transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-red-900/40 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isLogin ? 'Access Terminal' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="bg-arc-900/50 px-8 py-4 border-t border-arc-700">
            <p className="text-xs text-gray-500 text-center">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {setIsLogin(!isLogin); setError('');}}
                className="text-arc-accent hover:underline font-bold"
              >
                {isLogin ? 'Register here' : 'Login here'}
              </button>
            </p>
          </div>
        </div>

        {/* Info Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            Secure connection to ARC Database
          </p>
          <p className="text-xs text-gray-700 mt-1 font-mono">
            🔒 All data encrypted
          </p>
        </div>
      </div>
    </div>
  );
};
