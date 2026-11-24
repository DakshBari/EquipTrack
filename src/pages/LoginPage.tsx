import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Lock,
  Mail,
  MapPin,
  Mic,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Unlock,
  Wrench,
  XCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { useEquipTrack } from '../context/EquipTrackContext';
import { SAMPLE_FAULT_PHOTO } from '../data/seedData';
import { UserRole } from '../types';

/* -------------------------------------------------------------------------- */
/* Static content                                                              */
/* -------------------------------------------------------------------------- */

const MOCK_CHECKS = [
  'Brakes (foot & parking)',
  'Steering responsiveness',
  'Tyres & wheel nuts',
  'Horn & reverse buzzer',
  'Hydraulic hoses & cylinders',
  'Seatbelt & restraint latch',
];
const MOCK_FAIL_INDEX = 4;

const TICKER = [
  'Forklifts',
  'Balers',
  'Loaders',
  'Trucks',
  'QR pre-starts',
  'Fault photos',
  'Voice notes',
  'SMS & email dispatch',
  'Equipment holds',
  'Return-to-service sign-off',
  'CSV compliance reports',
  'Canning Vale',
  'Jandakot',
];

const WORKFLOW = [
  {
    icon: QrCode,
    title: 'Scan the machine',
    text: 'Operator scans the QR tag and the right checklist opens.',
    who: 'Operator',
    tone: 'text-blue-400 border-blue-400/40',
  },
  {
    icon: ClipboardCheck,
    title: 'Complete the pre-start',
    text: 'Large Pass / Fail taps, photos and notes on any failed check.',
    who: 'Operator',
    tone: 'text-blue-400 border-blue-400/40',
  },
  {
    icon: AlertTriangle,
    title: 'Fault raised instantly',
    text: 'Failed checks become fault records. The supervisor is notified.',
    who: 'Automatic',
    tone: 'text-amber-400 border-amber-400/40',
  },
  {
    icon: Wrench,
    title: 'Hold, schedule, repair',
    text: 'Supervisor holds the machine and sends maintenance a direct link.',
    who: 'Supervisor · Maintenance',
    tone: 'text-amber-400 border-amber-400/40',
  },
  {
    icon: ShieldCheck,
    title: 'Back in service',
    text: 'Repair verified, hold lifted, full audit trail kept.',
    who: 'Supervisor',
    tone: 'text-emerald-400 border-emerald-400/40',
  },
];

const ROLE_DETAILS: {
  role: UserRole;
  title: string;
  icon: React.ElementType;
  accent: string;
  points: string[];
}[] = [
  {
    role: 'operator',
    title: 'Operators',
    icon: Smartphone,
    accent: 'text-blue-600 bg-blue-50',
    points: ['Scan QR or pick equipment', 'Phone-first pre-start checklist', 'Photo evidence on failed checks', 'Personal inspection history'],
  },
  {
    role: 'supervisor',
    title: 'Supervisors',
    icon: Wrench,
    accent: 'text-amber-700 bg-amber-50',
    points: ['Live fault queue & KPIs', 'Hold & schedule or escalate', 'Dispatch by SMS / email link', 'Approve return-to-service'],
  },
  {
    role: 'admin',
    title: 'Company admins',
    icon: ShieldCheck,
    accent: 'text-emerald-700 bg-emerald-50',
    points: ['Fleet register & QR tags', 'Users, roles and sites', 'Checklist templates', 'Compliance CSV exports'],
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mql) return;
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Self-playing phone mock-up of an operator pre-start. */
function PhoneMockup() {
  const reduced = usePrefersReducedMotion();
  const [tick, setTick] = useState(reduced ? 9 : 0);

  useEffect(() => {
    if (reduced) {
      setTick(9);
      return;
    }
    const id = window.setInterval(() => setTick((t) => (t >= 12 ? 0 : t + 1)), 750);
    return () => window.clearInterval(id);
  }, [reduced]);

  const answered = Math.min(tick, MOCK_CHECKS.length);
  const showToast = tick >= MOCK_CHECKS.length + 1;
  const pct = Math.round((answered / MOCK_CHECKS.length) * 100);
  const hasFail = answered > MOCK_FAIL_INDEX;

  return (
    <div className="relative w-[264px] h-[540px] rounded-[2.4rem] bg-slate-800 p-[7px] shadow-2xl shadow-blue-950/60 ring-1 ring-white/10">
      <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-2xl z-20" />
      <div className="relative h-full w-full rounded-[2rem] bg-slate-50 overflow-hidden flex flex-col text-slate-900">
        {/* App bar */}
        <div className="pt-7 px-4 pb-2.5 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="font-semibold text-blue-700">← Back</span>
            <span className="font-mono">Canning Vale</span>
          </div>
          <div className="mt-1.5 text-[13px] font-bold">Forklift 01 · Pre-Start</div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="font-semibold tabular-nums">
              {answered}/{MOCK_CHECKS.length} completed
            </span>
            {hasFail ? (
              <span className="font-semibold text-red-600">1 failed</span>
            ) : (
              <span className="text-slate-400 tabular-nums">{pct}%</span>
            )}
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${hasFail ? 'bg-amber-500' : 'bg-blue-700'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="flex-1 px-3 py-2.5 space-y-1.5 overflow-hidden">
          {MOCK_CHECKS.map((label, idx) => {
            const done = idx < answered;
            const failed = done && idx === MOCK_FAIL_INDEX;
            return (
              <div
                key={label}
                className={`rounded-xl border px-2.5 py-2 transition-colors duration-300 ${
                  failed
                    ? 'bg-red-50 border-red-300'
                    : done
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : idx === answered
                    ? 'bg-white border-blue-300 ring-2 ring-blue-100'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10.5px] font-semibold leading-tight">{label}</span>
                  {failed ? (
                    <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  ) : done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="flex gap-1 shrink-0">
                      <span className="px-1.5 py-0.5 rounded-md border border-slate-200 text-[8px] font-bold text-slate-500">
                        Pass
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md border border-slate-200 text-[8px] font-bold text-slate-500">
                        Fail
                      </span>
                    </span>
                  )}
                </div>
                {failed && (
                  <div className="mt-1.5 flex items-center gap-1.5 et-rise">
                    <img
                      src={SAMPLE_FAULT_PHOTO}
                      alt=""
                      className="w-7 h-7 rounded-md object-cover border border-red-200"
                    />
                    <span className="flex-1 text-[9px] text-red-800 leading-snug">
                      Hose weeping at mast, oil on floor
                    </span>
                    <span className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center">
                      <Camera className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit / toast */}
        <div className="px-3 pb-4 pt-1">
          {showToast ? (
            <div className="et-rise rounded-xl bg-slate-900 text-white px-3 py-2.5 flex items-start gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <div className="text-[10.5px] font-bold">Fault FR-1020 created</div>
                <div className="text-[9px] text-slate-300">Supervisor notified · photo attached</div>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-xl py-2.5 text-center text-[11px] font-bold text-white transition-colors ${
                hasFail ? 'bg-red-600' : 'bg-blue-700'
              }`}
            >
              {answered < MOCK_CHECKS.length
                ? `Submit · ${MOCK_CHECKS.length - answered} left`
                : 'Submit & Report 1 Fault'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

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

  const scrollToSignIn = () => {
    document.getElementById('sign-in')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => document.getElementById('login-email')?.focus({ preventScroll: true }), 400);
  };

  const demoCards: {
    role: UserRole;
    title: string;
    person: string;
    site: string;
    email: string;
    icon: React.ElementType;
    tone: string;
  }[] = [
    {
      role: 'operator',
      title: 'Operator',
      person: 'James Wilson',
      site: 'Canning Vale',
      email: 'operator@demo.com',
      icon: Smartphone,
      tone: 'text-blue-700 bg-blue-50 group-hover:bg-blue-700 group-hover:text-white',
    },
    {
      role: 'supervisor',
      title: 'Supervisor',
      person: 'Sarah Mitchell',
      site: 'Both sites',
      email: 'supervisor@demo.com',
      icon: Wrench,
      tone: 'text-amber-700 bg-amber-50 group-hover:bg-amber-500 group-hover:text-white',
    },
    {
      role: 'admin',
      title: 'Admin',
      person: 'Craig Henderson',
      site: 'Organisation',
      email: 'admin@demo.com',
      icon: ShieldCheck,
      tone: 'text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* ================================================================ */}
      {/* HERO: sign-in first                                              */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div aria-hidden className="absolute -top-48 -left-40 w-[42rem] h-[42rem] rounded-full bg-blue-600/25 blur-3xl" />
        <div aria-hidden className="absolute top-40 -right-40 w-[34rem] h-[34rem] rounded-full bg-indigo-500/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-40 left-1/3 w-[28rem] h-[28rem] rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top bar */}
          <header className="flex items-center justify-between gap-3 py-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-display font-bold text-base flex items-center justify-center shadow-lg shadow-blue-900/50 ring-1 ring-white/15 shrink-0">
                ET
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg font-bold tracking-tight leading-none">EquipTrack</div>
                <div className="hidden sm:block text-[11px] text-slate-400 mt-1">
                  Pre-Start Inspection & Maintenance Management · Australia
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          </header>

          {resetMessage && (
            <div
              role="status"
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
            >
              {resetMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center pt-4 pb-14 lg:pt-8 lg:pb-20">
            {/* --- Sign in --- */}
            <div id="sign-in" className="scroll-mt-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Live interactive demo
              </div>
              <h1 className="mt-4 font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.08] text-balance">
                Every machine checked.{' '}
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  Every fault followed through.
                </span>
              </h1>

              {/* Card with animated gradient border */}
              <div className="mt-7 relative rounded-[1.4rem] p-[1.5px] overflow-hidden shadow-2xl shadow-black/50 max-w-[30rem]">
                <div
                  aria-hidden
                  className="absolute inset-[-60%] et-spin-slow"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0deg, #3b82f6 70deg, transparent 140deg, transparent 180deg, #f59e0b 250deg, transparent 320deg)',
                  }}
                />
                <div className="relative rounded-[1.32rem] bg-white text-slate-900 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold">Sign in</h2>
                    <span className="text-[11px] font-mono text-slate-500">Password: Demo@123</span>
                  </div>

                  <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
                    <div>
                      <label htmlFor="login-email" className="sr-only">
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
                          className="w-full min-h-[48px] pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                          placeholder="Email address"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="login-password" className="sr-only">
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
                          className="w-full min-h-[48px] pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                          placeholder="Password"
                        />
                      </div>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-red-700"
                      >
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="group w-full min-h-[48px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      Sign In
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </form>

                  <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    or one-click demo
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {demoCards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <button
                          key={card.role}
                          type="button"
                          onClick={() => handleQuickDemoLogin(card.role)}
                          title={`${card.email} · Demo@123`}
                          className="group rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md bg-white p-2.5 sm:p-3 text-left transition-all hover:-translate-y-0.5"
                        >
                          <span
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${card.tone}`}
                          >
                            <Icon className="w-[18px] h-[18px]" />
                          </span>
                          <span className="mt-2 block text-sm font-bold text-slate-900">{card.title}</span>
                          <span className="block text-[11px] text-slate-500 truncate">{card.person}</span>
                          <span className="hidden sm:block text-[10px] text-slate-400 truncate">{card.site}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-x-2 gap-y-0.5 text-[10.5px] font-mono text-slate-500">
                    <span className="truncate">operator@demo.com</span>
                    <span className="truncate">supervisor@demo.com</span>
                    <span className="truncate">admin@demo.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Product preview --- */}
            <div className="relative flex justify-center lg:justify-end lg:pr-10" aria-hidden>
              {/* Floating: supervisor queue */}
              <div className="hidden xl:block absolute -left-2 top-8 z-10 et-float">
                <div className="w-52 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 p-3.5 shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-semibold">Supervisor queue</span>
                    <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
                  </div>
                  <div className="mt-2 flex items-end gap-1.5 h-12">
                    {[40, 65, 35, 80, 55, 90, 70].map((h, i) => (
                      <span
                        key={i}
                        className={`flex-1 rounded-sm ${i === 5 ? 'bg-amber-400' : 'bg-blue-400/70'}`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
                    <div className="rounded-lg bg-white/5 py-1.5">
                      <div className="text-sm font-bold text-amber-300 tabular-nums">3</div>
                      <div className="text-[9px] text-slate-400">Review</div>
                    </div>
                    <div className="rounded-lg bg-white/5 py-1.5">
                      <div className="text-sm font-bold text-red-300 tabular-nums">1</div>
                      <div className="text-[9px] text-slate-400">Urgent</div>
                    </div>
                    <div className="rounded-lg bg-white/5 py-1.5">
                      <div className="text-sm font-bold text-emerald-300 tabular-nums">12</div>
                      <div className="text-[9px] text-slate-400">Fixed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating: maintenance progress */}
              <div className="hidden xl:block absolute -left-2 bottom-16 z-10 et-float-delayed">
                <div className="w-52 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 p-3.5 shadow-2xl shadow-black/40">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-white">FR-1019 · In progress</div>
                      <div className="text-[10px] text-slate-400">Michael Brown · Swan Fleet</div>
                    </div>
                  </div>
                  <div className="mt-2.5 relative h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" />
                    <div className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent et-flow" />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[9px] text-slate-400">
                    <span>Acknowledged</span>
                    <span>Started</span>
                    <span className="text-slate-500">Complete</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-10 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="relative scale-[0.92] sm:scale-100 origin-top">
                  <PhoneMockup />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="relative border-y border-white/10 bg-white/[0.03] py-3.5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max et-marquee">
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} className="flex items-center gap-6 pr-6 text-sm font-medium text-slate-400 whitespace-nowrap">
                {item}
                <span className="w-1.5 h-1.5 rotate-45 bg-amber-400/70" aria-hidden />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* WORKFLOW                                                          */}
      {/* ================================================================ */}
      <section className="relative max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">The loop</div>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            From walk-around to back in service.
          </h2>
          <p className="mt-3 text-slate-400">
            One connected record follows each machine. Nobody re-types a fault, and nothing returns
            to service without sign-off.
          </p>
        </div>

        <ol className="mt-12 relative grid grid-cols-1 md:grid-cols-5 gap-4">
          <span
            aria-hidden
            className="hidden md:block absolute top-7 left-[10%] right-[10%] h-px bg-gradient-to-r from-blue-500/50 via-amber-400/50 to-emerald-400/50 overflow-hidden"
          >
            <span className="absolute inset-y-0 w-1/5 bg-gradient-to-r from-transparent via-white to-transparent et-flow" />
          </span>
          {WORKFLOW.map((step, idx) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="relative flex md:flex-col items-start md:items-center gap-4 md:gap-0 md:text-center"
              >
                <span
                  className={`relative w-14 h-14 rounded-2xl border bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-black/30 ${step.tone}`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800 border border-white/15 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                    {idx + 1}
                  </span>
                </span>
                <div className="md:mt-4">
                  <h3 className="text-sm font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-400 leading-relaxed">{step.text}</p>
                  <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {step.who}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ================================================================ */}
      {/* BENTO FEATURES                                                    */}
      {/* ================================================================ */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* QR scan */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-900/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 text-blue-300 px-2.5 py-1 text-[11px] font-semibold">
                <QrCode className="w-3.5 h-3.5" /> QR pre-starts
              </span>
              <h3 className="mt-3 font-display text-2xl font-bold">Scan. Check. Done.</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-sm leading-relaxed">
                Every machine carries a QR tag. Operators scan it with their phone camera and the
                correct checklist for that forklift, baler, loader or truck opens instantly.
              </p>
            </div>
            <div className="relative shrink-0 rounded-2xl bg-white p-4 shadow-2xl shadow-blue-950/50" aria-hidden>
              <QRCodeSVG value="/equipment/FL-001" size={132} level="M" />
              <span className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_12px_2px_rgba(239,68,68,0.7)] et-scan-line" />
              {['top-1 left-1 border-t-2 border-l-2', 'top-1 right-1 border-t-2 border-r-2', 'bottom-1 left-1 border-b-2 border-l-2', 'bottom-1 right-1 border-b-2 border-r-2'].map((c) => (
                <span key={c} className={`absolute w-5 h-5 border-blue-600 rounded-sm ${c}`} />
              ))}
              <div className="mt-2 text-center text-[10px] font-mono font-semibold text-slate-600">FL-001</div>
            </div>
          </div>

          {/* Voice */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 text-red-300 px-2.5 py-1 text-[11px] font-semibold">
              <Mic className="w-3.5 h-3.5" /> Voice notes
            </span>
            <h3 className="mt-3 font-display text-xl font-bold">Speak instead of typing.</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Supervisors and maintenance crews dictate instructions and work notes, even with gloves on.
            </p>
            <div className="mt-6 flex items-center gap-3" aria-hidden>
              <span className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-[0_0_0_6px_rgba(220,38,38,0.18)]">
                <Mic className="w-5 h-5" />
              </span>
              <div className="flex items-center gap-[3px] h-10">
                {Array.from({ length: 22 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[3px] h-full rounded-full bg-gradient-to-t from-red-500 to-amber-300 et-wave-bar"
                    style={{ animationDelay: `${(i * 97) % 900}ms`, animationDuration: `${900 + ((i * 53) % 500)}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Auto fault */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-300 px-2.5 py-1 text-[11px] font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" /> Automatic faults
            </span>
            <h3 className="mt-3 font-display text-xl font-bold">Report once. That's it.</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              A failed check creates the fault with equipment, site, operator, notes and photos
              already attached.
            </p>
            <div className="mt-5 rounded-2xl bg-white text-slate-900 p-3 flex items-center gap-3 shadow-xl" aria-hidden>
              <img src={SAMPLE_FAULT_PHOTO} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold">FR-1020</span>
                  <span className="text-[10px] font-semibold text-red-600">High</span>
                </div>
                <div className="text-xs font-semibold truncate">Hydraulic hoses & cylinders</div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Camera className="w-3 h-3" /> 1 photo · James Wilson · FL-001
                </div>
              </div>
            </div>
          </div>

          {/* Return to service */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/40 to-slate-900 p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
              <div className="flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 px-2.5 py-1 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Safety lock-out
                </span>
                <h3 className="mt-3 font-display text-2xl font-bold">Nothing runs until it's signed off.</h3>
                <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
                  Held equipment can't start a pre-start. It only returns to service after the
                  supervisor reviews the repair notes and photos.
                </p>
              </div>
              <ol className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-2" aria-label="Equipment status stages">
                {[
                  { label: 'On Hold', icon: Lock, cls: 'border-red-400/30 bg-red-500/10 text-red-300' },
                  { label: 'Under Maintenance', icon: Wrench, cls: 'border-blue-400/30 bg-blue-500/10 text-blue-300' },
                  { label: 'Awaiting Sign-off', icon: ClipboardCheck, cls: 'border-amber-400/30 bg-amber-500/10 text-amber-300' },
                  { label: 'Operational', icon: Unlock, cls: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.label} className={`rounded-xl border px-3 py-3 flex items-center gap-2 text-xs font-semibold ${s.cls}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {s.label}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* ROLES                                                             */}
      {/* ================================================================ */}
      <section className="bg-slate-50 text-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Built for every role</div>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Three workspaces. One source of truth.
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROLE_DETAILS.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.role} className="rounded-2xl bg-white border border-slate-200 p-6">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${r.accent}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{r.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {r.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-800 text-white p-8 sm:p-10">
            <div
              aria-hidden
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
                backgroundSize: '22px 22px',
              }}
            />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                  See the whole loop in two minutes.
                </h2>
                <p className="mt-2 text-blue-100 max-w-lg">
                  Fail a check as the operator, then switch to the supervisor and watch the fault arrive.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('operator')}
                  className="min-h-[48px] px-5 rounded-xl bg-white text-blue-800 hover:bg-blue-50 text-sm font-bold flex items-center gap-2 shadow-lg"
                >
                  Start as Operator
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={scrollToSignIn}
                  className="min-h-[48px] px-5 rounded-xl border border-white/30 hover:bg-white/10 text-sm font-semibold"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 border-t border-white/10 text-slate-500 px-4 sm:px-6 py-6 text-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-700 text-white font-display font-bold text-[10px] flex items-center justify-center">
              ET
            </span>
            EquipTrack Industrial Pre-Start & Maintenance Platform
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Canning Vale · Jandakot (LocalStorage Interactive Demo)
          </span>
        </div>
      </footer>
    </div>
  );
}
