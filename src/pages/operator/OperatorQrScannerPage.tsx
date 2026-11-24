import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, ChevronRight, ImageUp, QrCode, Search } from 'lucide-react';
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
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoScanning, setPhotoScanning] = useState(false);
  const [manualId, setManualId] = useState('FL-001');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const handledRef = useRef(false);

  // The live scanner needs the browser camera API, which only exists on https
  // (or localhost). The photo fallback below works everywhere.
  const liveCameraSupported =
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch {
        // Ignore cleanup errors
      }
    }
    if (mountedRef.current) setCameraActive(false);
  };

  const handleDecodedValue = (decodedText: string) => {
    const cleaned = decodedText.trim();
    const match = cleaned.match(/\/equipment\/([A-Za-z0-9-]+)/);
    const eqId = match ? match[1].toUpperCase() : cleaned.toUpperCase();
    const found = state.equipment.find((e) => e.id.toUpperCase() === eqId);
    if (found) {
      // The scanner fires repeatedly while the code stays in view; act once.
      if (handledRef.current) return;
      handledRef.current = true;
      stopScanner().finally(() => navigate(`/equipment/${found.id}`));
    } else {
      setCameraError(`QR code "${cleaned}" did not match a known EquipTrack equipment ID.`);
    }
  };

  const describeCameraError = (err: unknown): string => {
    const name = (err as { name?: string })?.name || '';
    const text = String((err as { message?: string })?.message || err || '');
    if (!liveCameraSupported || /mediaDevices|not supported/i.test(text)) {
      return 'Live camera scanning needs a secure (https) connection, so this browser blocked it. Use “Scan from Photo” below instead.';
    }
    if (name === 'NotAllowedError' || /permission|denied|not allowed/i.test(text)) {
      return 'Camera permission was blocked. Allow camera access for this site in your browser settings, or use “Scan from Photo”.';
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError' || /not found|no camera|requested device/i.test(text)) {
      return 'No camera was found on this device. Use “Scan from Photo” or pick the equipment below.';
    }
    if (name === 'NotReadableError' || /could not start|in use|track/i.test(text)) {
      return 'The camera is being used by another app. Close it and try again, or use “Scan from Photo”.';
    }
    return 'The camera could not be started in this browser. Use “Scan from Photo” or pick the equipment below.';
  };

  const startScanner = async () => {
    if (cameraStarting || scannerRef.current) return;
    setCameraError(null);
    handledRef.current = false;
    if (!liveCameraSupported) {
      setCameraError(describeCameraError(null));
      return;
    }
    setCameraStarting(true);
    try {
      // This element is never rendered into by React (the placeholder is a
      // separate overlay), because html5-qrcode clears and fills it itself.
      const html5QrCode = new Html5Qrcode('qr-reader-region', { verbose: false });
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (w: number, h: number) => {
            const size = Math.max(160, Math.floor(Math.min(w, h) * 0.7));
            return { width: size, height: size };
          } },
        (decodedText) => {
          handleDecodedValue(decodedText);
        },
        () => {
          // Ignore frame decode misses
        }
      );
      if (!mountedRef.current) {
        await stopScanner();
        return;
      }
      setCameraActive(true);
    } catch (err) {
      try {
        scannerRef.current?.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
      if (mountedRef.current) {
        setCameraActive(false);
        setCameraError(describeCameraError(err));
      }
    } finally {
      if (mountedRef.current) setCameraStarting(false);
    }
  };

  // Fallback: same native camera capture used for fault photos, then decode the picture.
  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCameraError(null);
    handledRef.current = false;
    if (scannerRef.current) await stopScanner();
    setPhotoScanning(true);
    try {
      const decoder = new Html5Qrcode('qr-file-region', { verbose: false });
      const decoded = await decoder.scanFile(file, false);
      try {
        decoder.clear();
      } catch {
        // ignore
      }
      handleDecodedValue(decoded);
    } catch {
      setCameraError(
        'No QR code found in that photo. Hold the phone closer so the tag fills most of the picture, and try again.'
      );
    } finally {
      if (mountedRef.current) setPhotoScanning(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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
                disabled={cameraStarting}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                {cameraStarting ? 'Starting…' : 'Start Camera'}
              </button>
            )}
          </div>

          <div
            className={`relative w-full rounded-xl overflow-hidden bg-slate-900 text-white ${
              cameraActive || cameraStarting ? 'min-h-[260px]' : 'h-40'
            }`}
          >
            {/* Scanner mount point: must stay empty in React (html5-qrcode owns its contents) */}
            <div id="qr-reader-region" className="w-full [&_video]:w-full [&_video]:h-auto [&_video]:block" />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                <QrCode className="w-9 h-9 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-300">
                  {cameraStarting
                    ? 'Starting camera… allow access if your browser asks.'
                    : 'Tap Start Camera to scan a physical asset QR sticker'}
                </p>
              </div>
            )}
          </div>

          {/* Hidden element the photo decoder needs */}
          <div id="qr-file-region" className="hidden" aria-hidden />

          {/* Photo fallback: uses the phone's own camera app, like fault photos */}
          <label
            className={`w-full min-h-[48px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-800 flex items-center justify-center gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-blue-700 ${
              photoScanning ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            <ImageUp className="w-4 h-4 text-blue-700" />
            <span>{photoScanning ? 'Reading QR code…' : 'Scan from Photo'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoScan}
              className="sr-only"
            />
          </label>
          {!liveCameraSupported && !cameraError && (
            <p className="text-[11px] text-slate-500 -mt-1">
              Live scanning needs https. On this connection, use Scan from Photo: take a picture of the tag.
            </p>
          )}

          {cameraError && (
            <div role="alert" className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-800">
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
