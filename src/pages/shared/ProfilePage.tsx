import { useState } from 'react';
import { LogOut, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { getSiteName } from '../../utils/formatters';

export function DashboardProfilePage({ mode }: { mode: 'supervisor' | 'admin' }) {
  const { currentUser, logout, resetDemoData, loginAsRole } = useEquipTrack();
  const navigate = useNavigate();
  const [resetDone, setResetDone] = useState(false);

  return (
    <DashboardLayout mode={mode} title="Account Profile">
      <div className="max-w-2xl space-y-5">
        <section className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white font-bold text-lg flex items-center justify-center">
              {currentUser?.initials || 'ET'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{currentUser?.name}</h2>
              <p className="text-sm text-slate-600">
                {currentUser?.roleTitle} · {currentUser?.email}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Assigned Site</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">
                {getSiteName(currentUser?.siteId || 'canning-vale')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Contact Phone</dt>
              <dd className="font-mono text-slate-900 mt-0.5">{currentUser?.phone}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Quick Demo Account Switching</h3>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                loginAsRole('operator');
                navigate('/operator');
              }}
              className="min-h-[42px] px-4 rounded-xl border border-slate-200 hover:border-blue-700 text-xs font-semibold text-slate-800"
            >
              Switch to Operator Mobile App
            </button>
            {mode !== 'supervisor' && (
              <button
                type="button"
                onClick={() => {
                  loginAsRole('supervisor');
                  navigate('/supervisor');
                }}
                className="min-h-[42px] px-4 rounded-xl border border-slate-200 hover:border-blue-700 text-xs font-semibold text-slate-800"
              >
                Switch to Supervisor Dashboard
              </button>
            )}
            {mode !== 'admin' && (
              <button
                type="button"
                onClick={() => {
                  loginAsRole('admin');
                  navigate('/admin');
                }}
                className="min-h-[42px] px-4 rounded-xl border border-slate-200 hover:border-blue-700 text-xs font-semibold text-slate-800"
              >
                Switch to Company Admin
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Demo Session Controls</h3>
          {resetDone && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800">
              Demo data reset to initial Canning Vale & Jandakot state.
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                setResetDone(true);
                setTimeout(() => setResetDone(false), 3000);
              }}
              className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-800 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Demo Data
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="min-h-[44px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
