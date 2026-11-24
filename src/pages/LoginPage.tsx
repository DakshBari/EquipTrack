import React, { useState } from 'react';
import {
  ArrowRight,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEquipTrack } from '../context/EquipTrackContext';
import { UserRole } from '../types';

export function LoginPage() {
  const { loginWithCredentials, loginAsRole, resetDemoData } = useEquipTrack();
  const navigate = useNavigate();

  const [email, setEmail] = useState('operator@demo.com');
  const [password, setPassword] = useState('Demo@123');
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const navigateForRole = (role: UserRole) => {
    if (role === 'operator') navigate('/operator');
    else if (role === 'supervisor') navigate('/supervisor');
    else navigate('/admin');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = loginWithCredentials(email, password);
    if (!res.ok || !res.user) {
      setError(res.error || 'Unable to sign in');
      return;
    }
    navigateForRole(res.user.role);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    setError(null);
    const user = loginAsRole(role);
    if (user) {
      navigateForRole(user.role);
    }
  };

  const handleReset = () => {
    resetDemoData();
    setResetMessage('Demo dataset restored to initial Canning Vale & Jandakot state.');
    setTimeout(() => setResetMessage(null), 4000);
  };

  const demoCards: {
    role: UserRole;
    title: string;
    person: string;
    site: string;
    email: string;
    summary: string;
    icon: React.ElementType;
  }[] = [
    {
      role: 'operator',
      title: 'Operator Mobile App',
      person: 'James Wilson',
      site: 'Canning Vale',
      email: 'operator@demo.com',
      summary: 'QR equipment scanning, daily pre-start checklists, and mobile fault reporting.',
      icon: Smartphone,
    },
    {
      role: 'supervisor',
      title: 'Supervisor / Manager',
      person: 'Sarah Mitchell',
      site: 'Canning Vale & Jandakot',
      email: 'supervisor@demo.com',
      summary: 'Triage faults, hold equipment, dispatch SMS/email maintenance, and approve return-to-service.',
      icon: Wrench,
    },
    {
      role: 'admin',
      title: 'Company Admin',
      person: 'Craig Henderson',
      site: 'Organisation-wide',
      email: 'admin@demo.com',
      summary: 'Manage fleet, QR tags, users, sites, checklist templates, and CSV compliance reports.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14 flex-1 flex flex-col justify-center">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white font-display font-bold text-base flex items-center justify-center">
              ET
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">EquipTrack</h1>
              <p className="text-xs text-slate-500">
                Pre-Start Inspection & Maintenance Management · Australia
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>

        {resetMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {resetMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: One-Click Demo Role Cards */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                Select a demo role to enter EquipTrack
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
                Explore the complete workflow across Canning Vale and Jandakot operations—from
                QR pre-start inspections on mobile to maintenance dispatch and return-to-service
                sign-off.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-1">
              {demoCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => handleQuickDemoLogin(card.role)}
                    className="group w-full text-left rounded-2xl bg-white border border-slate-200 hover:border-blue-700 p-5 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-base font-bold text-slate-900">{card.title}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-medium text-slate-600">{card.person}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">{card.site}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{card.summary}</p>
                        <div className="mt-2 text-xs font-mono text-slate-500">
                          {card.email} · Demo@123
                        </div>
                      </div>
                    </div>
                    <span className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-700 group-hover:text-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors">
                      Enter
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Manual Credential Sign-In */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7">
            <h3 className="text-lg font-bold text-slate-900">Sign in with credentials</h3>
            <p className="mt-1 text-xs text-slate-500">
              Enter any demo account email and password <span className="font-mono">Demo@123</span>.
            </p>

            <form onSubmit={handleManualSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    placeholder="operator@demo.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    placeholder="Demo@123"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-2">Demo Accounts Reference</div>
              <div className="space-y-1.5 text-xs font-mono text-slate-600">
                <div className="flex justify-between">
                  <span>Operator:</span>
                  <span>operator@demo.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Supervisor:</span>
                  <span>supervisor@demo.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Company Admin:</span>
                  <span>admin@demo.com</span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1">
                  <span>Shared Password:</span>
                  <span>Demo@123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>EquipTrack Industrial Pre-Start & Maintenance Platform</span>
          <span>Canning Vale · Jandakot (LocalStorage Interactive Demo)</span>
        </div>
      </footer>
    </div>
  );
}
