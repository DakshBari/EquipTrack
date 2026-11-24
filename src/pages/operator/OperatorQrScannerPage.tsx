import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, ChevronRight, QrCode, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { EquipmentStatusLabel } from '../../components/StatusBadge';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { MobileOperatorLayout } from '../../layouts/MobileOperatorLayout';
import { getSiteName } from '../../utils/formatters';

export function OperatorQrScannerPage() {
  const { state } = useEquipTrack();
  const navigate = useNavigate();

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualId, setManualId] = useState('FL-001');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const handleDecodedValue = (decodedText: string) => {
    const cleaned = decodedText.trim();
    const match = cleaned.match(/\/equipment\/([A-Za-z0-9-]+)/);
    const eqId = match ? match[1].toUpperCase() : cleaned.toUpperCase();
    const found = state.equipment.find((e) => e.id.toUpperCase() === eqId);
    if (found) {
      stopScanner();
      navigate(`/equipment/${found.id}`);
    } else {
      setCameraError(`QR code "${cleaned}" did not match a known EquipTrack equipment ID.`);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-region');
      scannerRef.current = html5QrCode;
      setCameraActive(true);
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          handleDecodedValue(decodedText);
        },
        () => {
          // Ignore frame decode misses
        }
      );
    } catch {
      setCameraActive(false);
      setCameraError(
        'Camera access is unavailable in this browser or preview frame. Use Simulated Scan or select an equipment tag below.'
      );
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const featuredSampleIds = ['FL-001', 'BAL-001', 'TR-001', 'LD-001', 'FL-003', 'FL-002'];
  const featuredEquipment = featuredSampleIds
    .map((id) => state.equipment.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  return (
    <MobileOperatorLayout title="Scan Equipment QR" showBack backTo="/operator">
      <div className="p-4 space-y-5">
        {/* Live Camera Scanner Panel */}
        <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Camera QR Scanner</h2>
              <p className="text-xs text-slate-500">
                Point camera at the machine’s EquipTrack QR tag
              </p>
            </div>
            {cameraActive ? (
              <button
                type="button"
                onClick={stopScanner}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <CameraOff className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={startScanner}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                Start Camera
              </button>
            )}
          </div>

          <div
            id="qr-reader-region"
            className={`w-full rounded-xl overflow-hidden bg-slate-900 text-white flex flex-col items-center justify-center ${
              cameraActive ? 'min-h-[260px]' : 'h-40'
            }`}
          >
            {!cameraActive && (
              <div className="text-center px-4">
                <QrCode className="w-9 h-9 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-300">
                  Tap Start Camera to scan a physical asset QR sticker
                </p>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-800">
              {cameraError}
            </div>
          )}

          {/* Quick Demo Simulate Scan CTA */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => navigate('/equipment/FL-001')}
              className="w-full min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Simulate QR Scan: Forklift 01 (FL-001)
            </button>
          </div>
        </section>

        {/* Sample Printable QR Codes (Tap to Open) */}
        <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sample Equipment QR Tags</h3>
            <p className="text-xs text-slate-500">
              Tap any asset QR tag to simulate scanning its code
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featuredEquipment.map((eq) => (
              <button
                key={eq.id}
                type="button"
                onClick={() => navigate(`/equipment/${eq.id}`)}
                className="text-left rounded-xl border border-slate-200 hover:border-blue-700 p-3 flex items-center gap-3 transition-colors bg-slate-50/50"
              >
                <div className="p-1.5 bg-white rounded-lg border border-slate-200 shrink-0">
                  <QRCodeSVG value={`/equipment/${eq.id}`} size={52} level="L" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 truncate">{eq.name}</div>
                  <div className="text-xs font-mono text-slate-500">
                    /equipment/{eq.id} · {getSiteName(eq.siteId)}
                  </div>
                  <div className="mt-1.5">
                    <EquipmentStatusLabel status={eq.status} />
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* Manual Equipment Selection Fallback */}
        <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Manual Equipment Lookup</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                aria-label="Select equipment manually"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900"
              >
                {state.equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.id} — {eq.name} ({getSiteName(eq.siteId)} · {eq.status})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/equipment/${manualId}`)}
              className="min-h-[44px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold whitespace-nowrap"
            >
              Open Machine
            </button>
          </div>
        </section>
      </div>
    </MobileOperatorLayout>
  );
}
