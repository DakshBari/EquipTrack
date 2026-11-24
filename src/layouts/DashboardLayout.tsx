import React, { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  Forklift,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEquipTrack } from '../context/EquipTrackContext';
import { SiteId } from '../types';
import { getSiteName } from '../utils/formatters';

interface DashboardLayoutProps {
  mode: 'supervisor' | 'admin';
  title: string;
  children: React.ReactNode;
}

export function DashboardLayout({ mode, title, children }: DashboardLayoutProps) {
  const { state, currentUser, selectedSite, setSelectedSite, logout } = useEquipTrack();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = state.notifications.filter(
    (n) => !n.read && n.targetRoles.includes(mode)
  ).length;

  const urgentCount = state.faults.filter(
    (f) => f.status === 'Urgent' || f.status === 'Awaiting Review'
  ).length;

  const rtsCount = state.faults.filter(
    (f) => f.status === 'Awaiting Return-to-Service Approval' || f.status === 'Maintenance Completed'
  ).length;

  interface NavItem {
    label: string;
    to: string;
    icon: React.ElementType;
    exact?: boolean;
    count?: number;
  }

  // Supervisors triage day-to-day operations. Reports are reached from Inspections,
  // notifications and profile from the top bar.
  const supervisorLinks: NavItem[] = [
    { label: 'Overview', to: '/supervisor', icon: LayoutDashboard, exact: true },
    { label: 'Inspections', to: '/supervisor/prestarts', icon: ClipboardCheck },
    { label: 'Faults', to: '/supervisor/faults', icon: AlertTriangle, count: urgentCount },
    { label: 'Equipment', to: '/supervisor/equipment', icon: Forklift },
    { label: 'Maintenance', to: '/supervisor/maintenance', icon: Wrench, count: rtsCount },
  ];

  // Admins configure the organisation; fault triage and inspection review stay
  // with the supervisor workspace instead of being duplicated here.
  const adminLinks: NavItem[] = [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Equipment', to: '/admin/equipment', icon: Forklift },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Sites', to: '/admin/sites', icon: Building2 },
    { label: 'Checklists', to: '/admin/templates', icon: FileSpreadsheet },
    { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ];

  const profilePath = mode === 'supervisor' ? '/supervisor/profile' : '/admin/profile';

  const links: NavItem[] = mode === 'supervisor' ? supervisorLinks : adminLinks;

  const isLinkActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64">
      <div className="px-5 h-16 border-b border-slate-200 flex items-center justify-between shrink-0">
        <Link to={mode === 'supervisor' ? '/supervisor' : '/admin'} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-display font-bold text-sm flex items-center justify-center">
            ET
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-slate-900 whitespace-nowrap">
            EquipTrack
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-slate-100 text-xs text-slate-500">
        {mode === 'supervisor' ? 'Supervisor Workspace' : 'Company Administration'}
      </div>

      <nav aria-label="Dashboard navigation" className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {links.map((item) => {
          const active = isLinkActive(item.to, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`min-h-[42px] px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between gap-2 transition-colors whitespace-nowrap ${
                active
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="text-xs font-mono tabular-nums font-semibold text-blue-700">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3 shrink-0">
        <Link
          to={profilePath}
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 rounded-xl -mx-1 px-1 py-1 hover:bg-slate-50"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {currentUser?.initials || 'ET'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">
              {currentUser?.name || 'Demo User'}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {currentUser?.roleTitle || mode}
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          Switch Account
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base lg:text-lg font-bold text-slate-900 truncate">{title}</h1>
              <div className="text-xs text-slate-500 hidden sm:block">
                {getSiteName(selectedSite)} · {currentUser?.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2 sm:px-2.5 h-10">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
              <select
                aria-label="Select site"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value as SiteId | 'all')}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none pr-1 max-w-[92px] sm:max-w-none"
              >
                <option value="all">All Sites</option>
                <option value="canning-vale">Canning Vale</option>
                <option value="jandakot">Jandakot</option>
              </select>
            </div>

            {mode === 'supervisor' && (
              <Link
                to="/supervisor/notifications"
                className={`relative min-h-[40px] min-w-[40px] px-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                  isLinkActive('/supervisor/notifications')
                    ? 'border-blue-700 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="text-xs font-mono tabular-nums font-bold text-red-600">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            <Link
              to={profilePath}
              aria-label="Account profile"
              className={`flex items-center gap-2 min-h-[40px] min-w-[40px] justify-center px-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap ${
                isLinkActive(profilePath)
                  ? 'border-blue-700 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span>{currentUser?.initials}</span>
              <span className="hidden md:inline">{currentUser?.name}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
