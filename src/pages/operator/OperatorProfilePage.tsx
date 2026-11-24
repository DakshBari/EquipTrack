import { useState } from 'react';
import { LogOut, RotateCcw, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { MobileOperatorLayout } from '../../layouts/MobileOperatorLayout';
import { getSiteName } from '../../utils/formatters';

export function OperatorProfilePage() {
  const { currentUser, selectedSite, setSelectedSite, logout, resetDemoData, loginAsRole } =
    useEquipTrack();
  const navigate = useNavigate();
  const [resetToast, setResetToast] = useState(false);

  return (
    <MobileOperatorLayout title="Operator Profile">
      <div className="p-4 space-y-4">
        <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white font-bold text-base flex items-center justify-center">
              {currentUser?.initials || 'JW'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {currentUser?.name || 'James Wilson'}
              </h2>
              <p className="text-xs text-slate-500">
                {currentUser?.roleTitle} · {currentUser?.email}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Primary Site</span>
              <span className="font-semibold text-slate-900">
                {getSiteName(currentUser?.siteId || 'canning-vale')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Active View Site</span>
              <select
                value={selectedSite === 'all' ? 'canning-vale' : selectedSite}
                onChange={(e) => setSelectedSite(e.target.value as 'canning-vale' | 'jandakot')}
                className="min-h-[38px] px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
              >
                <option value="canning-vale">Canning Vale</option>
                <option value="jandakot">Jandakot</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Mobile</span>
              <span className="font-mono text-xs text-slate-900">{currentUser?.phone}</span>
            </div>
          </div>
        </section>

        {/* Quick Demo Role Switcher */}
        <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2.5">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-700" />
            <span>Demo Account Switcher</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                loginAsRole('supervisor');
                navigate('/supervisor');
              }}
              className="min-h-[44px] px-3 rounded-xl border border-slate-200 hover:border-blue-700 text-xs font-semibold text-slate-800"
            >
              Switch to Supervisor
            </button>
            <button
              type="button"
              onClick={() => {
                loginAsRole('admin');
                navigate('/admin');
              }}
              className="min-h-[44px] px-3 rounded-xl border border-slate-200 hover:border-blue-700 text-xs font-semibold text-slate-800"
            >
              Switch to Company Admin
            </button>
          </div>
        </section>

        <section className="space-y-2.5">
          {resetToast && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800">
              Demo data reset to initial seeded records.
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              resetDemoData();
              setResetToast(true);
              setTimeout(() => setResetToast(false), 3000);
            }}
            className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 flex items-center justify-center gap-2"
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
            className="w-full min-h-[46px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out to Login Screen
          </button>
        </section>
      </div>
    </MobileOperatorLayout>
  );
}
