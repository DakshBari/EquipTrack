import { useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EquipmentImage } from '../../components/EquipmentImage';
import { EquipmentStatusLabel } from '../../components/StatusBadge';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { MobileOperatorLayout } from '../../layouts/MobileOperatorLayout';
import { EquipmentType, SiteId } from '../../types';
import { getSiteName, isToday } from '../../utils/formatters';

export function OperatorEquipmentListPage() {
  const { state, currentUser } = useEquipTrack();
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState<SiteId | 'all'>(currentUser?.siteId || 'all');
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');

  const filtered = state.equipment.filter((eq) => {
    if (siteFilter !== 'all' && eq.siteId !== siteFilter) return false;
    if (typeFilter !== 'all' && eq.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        eq.id.toLowerCase().includes(q) ||
        eq.name.toLowerCase().includes(q) ||
        eq.manufacturer.toLowerCase().includes(q) ||
        eq.model.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <MobileOperatorLayout title="Site Equipment">
      <div className="p-4 space-y-4">
        {/* Search & Filter Controls */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID (e.g. FL-001), name, or model..."
              className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filter by site"
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value as SiteId | 'all')}
              className="min-h-[40px] px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
            >
              <option value="all">All Sites</option>
              <option value="canning-vale">Canning Vale</option>
              <option value="jandakot">Jandakot</option>
            </select>

            <select
              aria-label="Filter by equipment type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EquipmentType | 'all')}
              className="min-h-[40px] px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
            >
              <option value="all">All Types</option>
              <option value="Forklift">Forklifts</option>
              <option value="Baler">Balers</option>
              <option value="Loader">Loaders</option>
              <option value="Truck">Trucks</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="text-xs font-medium text-slate-500">
          Showing {filtered.length} machine{filtered.length === 1 ? '' : 's'}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
            No equipment matches your current filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((eq) => {
              const doneToday = isToday(eq.lastInspectionAt);
              return (
                <Link
                  key={eq.id}
                  to={`/equipment/${eq.id}`}
                  className="rounded-2xl bg-white border border-slate-200 hover:border-blue-700 p-3.5 flex items-center gap-3.5 transition-colors"
                >
                  <EquipmentImage
                    src={eq.imageUrl}
                    alt={eq.name}
                    type={eq.type}
                    className="w-20 h-16 rounded-xl shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{eq.name}</h3>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      {eq.id} · {eq.type} · {getSiteName(eq.siteId)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <EquipmentStatusLabel status={eq.status} />
                      <span className="text-[11px] font-medium text-slate-500">
                        {doneToday ? 'Checked today' : 'Pending today'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MobileOperatorLayout>
  );
}
