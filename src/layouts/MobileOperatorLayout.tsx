import React from 'react';
import {
  ClipboardList,
  Forklift,
  Home,
  LogOut,
  Monitor,
  QrCode,
  Smartphone,
  User as UserIcon,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEquipTrack } from '../context/EquipTrackContext';
import { getSiteName } from '../utils/formatters';

interface MobileOperatorLayoutProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  hideBottomNav?: boolean;
  children: React.ReactNode;
}

export function MobileOperatorLayout({
  title,
  showBack = false,
  backTo,
  hideBottomNav = false,
  children,
}: MobileOperatorLayoutProps) {
  const { currentUser, phoneFrameMode, setPhoneFrameMode, logout } = useEquipTrack();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', to: '/operator', icon: Home, match: (p: string) => p === '/operator' },
    {
      label: 'Equipment',
      to: '/operator/equipment',
      icon: Forklift,
      match: (p: string) => p.startsWith('/operator/equipment') || p.startsWith('/equipment/'),
    },
    {
      label: 'Scan QR',
      to: '/operator/scan',
      icon: QrCode,
      match: (p: string) => p.startsWith('/operator/scan'),
    },
    {
      label: 'History',
      to: '/operator/history',
      icon: ClipboardList,
      match: (p: string) => p.startsWith('/operator/history'),
    },
    {
      label: 'Profile',
      to: '/operator/profile',
      icon: UserIcon,
      match: (p: string) => p.startsWith('/operator/profile'),
    },
  ];

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const innerContent = (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900">
      {/* Compact Sticky Mobile Top App Bar (48px) */}
      <header className="sticky top-0 z-30 h-12 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[40px] px-2 -ml-1 rounded-lg text-sm font-semibold text-blue-700 hover:bg-blue-50 whitespace-nowrap shrink-0"
            >
              ← Back
            </button>
          ) : (
            <span className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              EquipTrack
            </span>
          )}
        </div>

        <h1 className="text-sm font-semibold text-slate-900 truncate text-center flex-1">
          {title}
        </h1>

        <div className="flex items-center gap-1.5 shrink-0">
          {currentUser && (
            <span className="text-xs font-medium text-slate-500 hidden sm:inline whitespace-nowrap">
              {getSiteName(currentUser.siteId)}
            </span>
          )}
          <Link
            to="/operator/profile"
            className="w-8 h-8 rounded-lg bg-blue-700 text-white text-xs font-semibold flex items-center justify-center shrink-0"
            aria-label="Operator profile"
          >
            {currentUser?.initials || 'OP'}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${hideBottomNav ? 'pb-6' : 'pb-20'}`}>{children}</main>

      {/* Fixed Bottom Tab Bar (56px) */}
      {!hideBottomNav && (
        <nav
          aria-label="Operator bottom navigation"
          className={`${
            phoneFrameMode ? 'sticky bottom-0' : 'fixed bottom-0 left-0 right-0'
          } z-40 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center`}
        >
          {navItems.map((item) => {
            const active = item.match(location.pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
                <span className="text-[10px] font-semibold tracking-tight leading-none whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Desktop Presenter Utility Bar (hidden on mobile screens) */}
      <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-slate-900 text-slate-200 border-b border-slate-800 no-print">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-semibold text-white">EquipTrack Operator View</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">
            {currentUser?.name || 'Operator'} ({getSiteName(currentUser?.siteId || 'canning-vale')})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setPhoneFrameMode(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                !phoneFrameMode ? 'bg-blue-700 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Responsive Full
            </button>
            <button
              type="button"
              onClick={() => setPhoneFrameMode(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                phoneFrameMode ? 'bg-blue-700 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile Frame (390px)
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            Switch Role
          </button>
        </div>
      </div>

      {/* Viewport Wrapper */}
      {phoneFrameMode ? (
        <div className="hidden md:flex flex-1 items-center justify-center py-6 px-4 bg-slate-200/80">
          <div className="w-[390px] h-[780px] rounded-[36px] border-[8px] border-slate-900 bg-slate-50 shadow-2xl overflow-y-auto overflow-x-hidden flex flex-col relative">
            {innerContent}
          </div>
        </div>
      ) : null}

      {/* Standard Responsive View (always used on < md, and on md+ when phoneFrameMode is false) */}
      <div className={phoneFrameMode ? 'md:hidden flex-1 flex flex-col' : 'flex-1 flex flex-col'}>
        <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col bg-slate-50 md:border-x md:border-slate-200">
          {innerContent}
        </div>
      </div>
    </div>
  );
}
