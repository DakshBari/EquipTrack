import { useState } from 'react';
import { Forklift, Package, Tractor, Truck } from 'lucide-react';
import { EquipmentType } from '../types';

interface EquipmentImageProps {
  src: string;
  alt: string;
  type: EquipmentType;
  className?: string;
}

export function EquipmentImage({ src, alt, type, className = '' }: EquipmentImageProps) {
  const [failed, setFailed] = useState(false);

  const Icon =
    type === 'Forklift'
      ? Forklift
      : type === 'Baler'
      ? Package
      : type === 'Loader'
      ? Tractor
      : Truck;

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-500 border border-slate-200 ${className}`}
      >
        <Icon className="w-8 h-8 mb-1.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-600">{type}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
