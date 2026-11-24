import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { MaintenanceContact } from '../types';

interface ContactPickerProps {
  contacts: MaintenanceContact[];
  value: string;
  onChange: (contactId: string) => void;
  label?: string;
}

/** Searchable, tap-to-select list of maintenance contacts. */
export function ContactPicker({ contacts, value, onChange, label = 'Maintenance Contact' }: ContactPickerProps) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q
    ? contacts.filter((c) =>
        [c.name, c.company, c.specialty, c.phone, c.email].some((f) => f.toLowerCase().includes(q))
      )
    : contacts;

  return (
    <div>
      <div className="block text-xs font-semibold text-slate-700 mb-1">{label}</div>
      {contacts.length > 1 ? (
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, company or specialty…"
            aria-label="Search maintenance contacts"
            className="w-full min-h-[42px] pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </div>
      ) : null}
      <div role="radiogroup" aria-label={label} className="space-y-1.5 max-h-56 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-xs text-slate-500 px-1 py-2">No contacts match “{query}”.</div>
        )}
        {filtered.map((c) => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(c.id)}
              className={`w-full min-h-[52px] text-left px-3 py-2 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                active ? 'border-blue-700 bg-blue-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{c.name}</div>
                <div className="text-xs text-slate-500 truncate">
                  {c.company} · {c.specialty}
                </div>
              </div>
              <span
                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                  active ? 'bg-blue-700 border-blue-700 text-white' : 'border-slate-300'
                }`}
              >
                {active && <Check className="w-3.5 h-3.5" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
