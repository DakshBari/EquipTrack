import React, { useState } from 'react';
import { Building2, Edit2, MapPin, X } from 'lucide-react';
import { SiteLocationMap } from '../../components/SiteLocationMap';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Site, SiteId } from '../../types';

export function AdminSitesPage() {
  const { state, updateSite } = useEquipTrack();
  const [focusedSite, setFocusedSite] = useState<SiteId | 'all'>('all');
  const [editing, setEditing] = useState<Site | null>(null);
  const [address, setAddress] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [bayCount, setBayCount] = useState('12');

  const openEdit = (site: Site) => {
    setEditing(site);
    setAddress(site.address);
    setManagerName(site.managerName);
    setPhone(site.phone);
    setBayCount(String(site.bayCount));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateSite({
      ...editing,
      address: address.trim(),
      managerName: managerName.trim(),
      phone: phone.trim(),
      bayCount: Number(bayCount) || editing.bayCount,
    });
    setEditing(null);
  };

  return (
    <DashboardLayout mode="admin" title="Sites Management">
      <div className="space-y-5">
        {/* Interactive Leaflet Map of Canning Vale & Jandakot */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">WA Facility Locations</h2>
                <p className="text-xs text-slate-500">
                  Live fleet and open fault distribution across Canning Vale and Jandakot
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(
                [
                  { id: 'all', label: 'All Sites' },
                  { id: 'canning-vale', label: 'Canning Vale' },
                  { id: 'jandakot', label: 'Jandakot' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFocusedSite(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    focusedSite === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <SiteLocationMap
            sites={state.sites}
            equipment={state.equipment}
            faults={state.faults}
            focusedSiteId={focusedSite}
            onSelectSite={(siteId) => setFocusedSite(siteId)}
            heightClass="h-72"
          />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {state.sites.map((site) => {
            const eqList = state.equipment.filter((e) => e.siteId === site.id);
            const personnel = state.users.filter((u) => u.siteId === site.id);
            const openFaults = state.faults.filter(
              (f) => f.siteId === site.id && f.status !== 'Resolved'
            ).length;

            return (
              <section
                key={site.id}
                className={`rounded-2xl bg-white border p-6 space-y-4 transition-colors ${
                  focusedSite === site.id ? 'border-blue-700' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{site.name}</h2>
                      <p className="text-xs text-slate-500">
                        {site.address}, {site.suburb} {site.state} {site.postcode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFocusedSite(site.id)}
                      className="min-h-[38px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-700" />
                      Locate
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(site)}
                      className="min-h-[38px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-blue-700 hover:bg-blue-50 flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Site Manager</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">{site.managerName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Site Phone</dt>
                    <dd className="font-mono text-xs text-slate-900 mt-1">{site.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Assigned Fleet</dt>
                    <dd className="font-mono tabular-nums font-bold text-slate-900 mt-0.5">
                      {eqList.length} machines ({site.bayCount} bays)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Personnel & Open Faults</dt>
                    <dd className="font-mono tabular-nums text-slate-900 mt-0.5">
                      {personnel.length} staff · {openFaults} open faults
                    </dd>
                  </div>
                </dl>
              </section>
            );
          })}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Edit {editing.name}</h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site Manager
                </label>
                <input
                  required
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Active Bays
                  </label>
                  <input
                    type="number"
                    required
                    value={bayCount}
                    onChange={(e) => setBayCount(e.target.value)}
                    className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="min-h-[40px] px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[40px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
              >
                Save Site
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
