import React from 'react';
import { Camera, ImagePlus, Trash2 } from 'lucide-react';

interface PhotoAttachFieldProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  label?: string;
  /** Optional sample image so the demo works without a camera. */
  demoPhoto?: string;
  demoLabel?: string;
  tone?: 'default' | 'danger' | 'success';
}

function readFiles(files: FileList, onRead: (dataUrl: string) => void) {
  Array.from(files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onRead(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** Camera capture / upload with thumbnails. Shared by checklist, maintenance and completion forms. */
export function PhotoAttachField({
  photos,
  onChange,
  label = 'Photos',
  demoPhoto,
  demoLabel = 'Use demo photo',
  tone = 'default',
}: PhotoAttachFieldProps) {
  const photosRef = React.useRef(photos);
  photosRef.current = photos;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    readFiles(files, (dataUrl) => {
      photosRef.current = [...photosRef.current, dataUrl];
      onChange(photosRef.current);
    });
    e.target.value = '';
  };

  const labelColor =
    tone === 'danger' ? 'text-red-900' : tone === 'success' ? 'text-emerald-900' : 'text-slate-700';

  return (
    <div className="space-y-2">
      <div className={`text-xs font-semibold ${labelColor}`}>
        {label} {photos.length > 0 && <span className="font-normal">({photos.length} attached)</span>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="min-h-[48px] px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-800 flex items-center justify-center gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-blue-700">
          <Camera className="w-5 h-5 text-blue-700 shrink-0" />
          <span>Take Photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFiles}
            className="sr-only"
          />
        </label>
        {demoPhoto ? (
          <button
            type="button"
            onClick={() => onChange([...photos, demoPhoto])}
            className="min-h-[48px] px-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-700 flex items-center justify-center gap-1.5"
          >
            <ImagePlus className="w-4 h-4 shrink-0" />
            <span>{demoLabel}</span>
          </button>
        ) : (
          <span />
        )}
      </div>

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {photos.map((photo, idx) => (
            <div
              key={idx}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white"
            >
              <img src={photo} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(photos.filter((_, i) => i !== idx))}
                aria-label={`Remove photo ${idx + 1}`}
                className="absolute top-1 right-1 w-7 h-7 rounded-lg bg-slate-900/75 text-white flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
