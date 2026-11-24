import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Render the panel as a <form> so Enter / submit buttons work. */
  onSubmit?: (e: React.FormEvent) => void;
  maxWidthClass?: string;
}

/**
 * Bottom sheet on phones, centred dialog on larger screens. Body scrolls while the
 * header and the action footer stay visible.
 */
export function Sheet({
  title,
  subtitle,
  onClose,
  children,
  footer,
  onSubmit,
  maxWidthClass = 'sm:max-w-md',
}: SheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const panelClass = `w-full ${maxWidthClass} max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden`;

  const inner = (
    <>
      <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="min-h-[40px] min-w-[40px] -mr-2 -mt-1 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto">{children}</div>
      {footer && (
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      )}
    </>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 sm:p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {onSubmit ? (
        <form onSubmit={onSubmit} className={panelClass}>
          {inner}
        </form>
      ) : (
        <div className={panelClass}>{inner}</div>
      )}
    </div>
  );
}
