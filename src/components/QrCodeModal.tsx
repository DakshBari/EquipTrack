import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Equipment } from '../types';
import { getSiteName } from '../utils/formatters';

interface QrCodeModalProps {
  equipment: Equipment;
  onClose: () => void;
}

export function QrCodeModal({ equipment, onClose }: QrCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const qrValue = `/equipment/${equipment.id}`;
  const fullUrl = `${window.location.origin}${qrValue}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 no-print">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Equipment QR Tag</h3>
            <p className="text-xs text-slate-500">Printable yard asset sticker</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR modal"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-full rounded-xl border-2 border-slate-900 p-5 bg-white flex flex-col items-center">
            <div className="text-xs font-semibold tracking-wider text-blue-700 mb-1">
              EQUIPTRACK ASSET TAG
            </div>
            <div className="text-lg font-bold text-slate-900">{equipment.name}</div>
            <div className="text-xs font-mono tabular-nums text-slate-600 mb-4">
              {equipment.id} · {getSiteName(equipment.siteId)}
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <QRCodeSVG value={qrValue} size={172} level="M" includeMargin={false} />
            </div>

            <div className="mt-3 text-[11px] font-mono text-slate-500 break-all">{qrValue}</div>
            <div className="mt-1 text-xs text-slate-600">
              Scan before shift to start pre-start check
            </div>
          </div>

          <div className="mt-5 w-full flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied URL' : 'Copy Link'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
