/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Mail, User, Info, Terminal, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.signin(demoEmail, demoPass);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await api.signin(email, password);
      } else {
        await api.signup(email, name, password);
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth_page_container" className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row items-stretch overflow-hidden font-sans">
      
      {/* Visual & Architectural Hero Banner (Left Side) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-12 flex-col justify-between relative border-r border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        {/* Brand Header */}
        <div className="z-10 flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              ApexTracker
            </h1>
            <p className="text-xs text-indigo-400 font-mono tracking-wider uppercase font-semibold">Clean Architecture Suite</p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="z-10 my-auto max-w-lg space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-100">
              Where Elegant Design Meets <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Backend Excellence</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Designed as a premium, production-ready full-stack portfolio piece. Learn, inspect, and deploy a system built with SOLID principles, JWT Refresh Auth, Audit Logs, Rate Limiting, and Gemini intelligence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-indigo-400 mb-2" />
              <h3 className="font-semibold text-xs text-slate-200">SOLID Core</h3>
              <p className="text-slate-400 text-[11px] mt-1">Decoupled data layer utilizing the Repository pattern.</p>
            </div>
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-purple-400 mb-2" />
              <h3 className="font-semibold text-xs text-slate-200">Gemini AI Module</h3>
              <p className="text-slate-400 text-[11px] mt-1">Smart category insights with strict JSON response schemas.</p>
            </div>
          </div>
        </div>

        {/* Architectural Footer */}
        <div className="z-10 flex items-center space-x-2 text-xs text-slate-500 font-mono">
          <Terminal className="w-4 h-4 text-slate-600" />
          <span>v1.0.0 (Express, TypeScript, JWT-Auth, localFS-Repo)</span>
        </div>
      </div>

      {/* Login & Register Card (Right Side) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16 bg-slate-950 relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-6 z-10"
        >
          {/* Mobile Brand Header */}
          <div className="md:hidden flex items-center space-x-3 justify-center mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">ApexTracker</h1>
          </div>

          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Sign in to access your financial dashboard' : 'Register your details to deploy your profile'}
            </p>
          </div>

          {/* Seeded Credentials Alert (Highly Educational) */}
          <div className="p-4 bg-slate-900 border border-indigo-900/50 rounded-xl space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wide">
              <Info className="w-3.5 h-3.5" />
              <span>Seeded Developer Accounts (Instant Login)</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button 
                id="btn_login_demo_student"
                type="button"
                onClick={() => handleDemoLogin('student@college.edu', 'student123')}
                disabled={loading}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition flex flex-col justify-between"
              >
                <span className="font-semibold text-slate-300">🎓 Demo Student</span>
                <span className="text-slate-500 text-[10px] font-mono mt-0.5">student@college.edu</span>
                <span className="text-slate-600 text-[9px] font-mono mt-0.5">Role: user | PW: student123</span>
              </button>

              <button 
                id="btn_login_demo_admin"
                type="button"
                onClick={() => handleDemoLogin('mentor@academy.org', 'admin123')}
                disabled={loading}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition flex flex-col justify-between"
              >
                <span className="font-semibold text-indigo-300">🛡️ Admin / Mentor</span>
                <span className="text-slate-500 text-[10px] font-mono mt-0.5">mentor@academy.org</span>
                <span className="text-slate-600 text-[9px] font-mono mt-0.5">Role: admin | PW: admin123</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-900/50 rounded-lg text-rose-200 text-xs flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></div>
                <span>{error}</span>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 block" htmlFor="input_name">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><User className="w-4 h-4" /></span>
                  <input
                    id="input_name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 block" htmlFor="input_email">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><Mail className="w-4 h-4" /></span>
                <input
                  id="input_email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-400 block" htmlFor="input_password">Password</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><Lock className="w-4 h-4" /></span>
                <input
                  id="input_password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              id="btn_auth_submit"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span>{isLogin ? 'Sign In Securely' : 'Create Profile'}</span>
              )}
            </button>
          </form>

          {/* Toggle Screen */}
          <div className="text-center text-xs">
            <button
              id="btn_toggle_auth_mode"
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline focus:outline-none"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
