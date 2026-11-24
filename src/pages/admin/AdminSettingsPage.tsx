import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';

export function AdminSettingsPage() {
  const { state, resetDemoData } = useEquipTrack();
  const [resetSuccess, setResetSuccess] = useState(false);

  return (
    <DashboardLayout mode="admin" title="Organisation Settings">
      <div className="max-w-2xl space-y-5">
        <section className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">EquipTrack Demo Environment</h2>
          <p className="text-sm text-slate-600">
            All inspections, fault reports, equipment holds, maintenance updates, and checklist
            template edits are persisted locally in your browser using LocalStorage.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="text-slate-500">Equipment Assets</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {state.equipment.length}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="text-slate-500">Pre-Start Records</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {state.inspections.length}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="text-slate-500">Fault Records</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {state.faults.length}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Reset Presentation Data</h3>
          <p className="text-xs text-slate-600">
            Restore all Canning Vale and Jandakot equipment, checklists, inspections, and faults to
            their clean starting state before a live demonstration.
          </p>
          {resetSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">
              Demo data has been restored to its initial state.
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              resetDemoData();
              setResetSuccess(true);
              setTimeout(() => setResetSuccess(false), 3500);
            }}
            className="min-h-[44px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Demo Data
          </button>
        </section>
      </div>
    </DashboardLayout>
  );
}
