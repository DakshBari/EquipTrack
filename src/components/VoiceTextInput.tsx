import { useEffect, useRef } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';

type Tone = 'default' | 'danger' | 'success' | 'warning';

const TONE_STYLES: Record<Tone, { field: string; label: string; chip: string }> = {
  default: {
    field: 'border-slate-200 bg-white focus:ring-blue-700',
    label: 'text-slate-700',
    chip: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  },
  danger: {
    field: 'border-red-200 bg-white focus:ring-red-600',
    label: 'text-red-900',
    chip: 'border-red-200 bg-white text-red-800 hover:bg-red-50',
  },
  success: {
    field: 'border-emerald-300 bg-white focus:ring-emerald-600',
    label: 'text-emerald-900',
    chip: 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50',
  },
  warning: {
    field: 'border-amber-300 bg-white focus:ring-amber-600',
    label: 'text-amber-900',
    chip: 'border-amber-200 bg-white text-amber-900 hover:bg-amber-50',
  },
};

export function appendText(existing: string, addition: string): string {
  const add = addition.trim();
  if (!add) return existing;
  if (!existing.trim()) return add.charAt(0).toUpperCase() + add.slice(1);
  const needsSpace = !/\s$/.test(existing);
  return `${existing}${needsSpace ? ' ' : ''}${add}`;
}

/** Adds a quick phrase as its own sentence. */
function appendPhrase(existing: string, phrase: string): string {
  const trimmed = existing.trimEnd();
  if (!trimmed) return phrase;
  return `${trimmed}${/[.!?]$/.test(trimmed) ? '' : '.'} ${phrase}`;
}

interface VoiceTextInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  tone?: Tone;
  /** Quick-insert phrases shown as tappable chips under the field. */
  suggestions?: string[];
  className?: string;
  textareaClassName?: string;
  /** Visually mark the field as having a validation problem. */
  invalid?: boolean;
}

/**
 * Textarea with a built-in microphone button. Speech is transcribed with the
 * browser Web Speech API and appended to whatever is already typed; the field
 * always stays editable by keyboard.
 */
export function VoiceTextInput({
  id,
  value,
  onChange,
  label,
  hint,
  placeholder,
  rows = 3,
  required,
  disabled,
  tone = 'default',
  suggestions,
  className = '',
  textareaClassName = '',
  invalid = false,
}: VoiceTextInputProps) {
  const valueRef = useRef(value);
  valueRef.current = value;

  const { supported, listening, interim, error, clearError, toggle, stop } = useSpeechToText({
    onFinalText: (text) => onChange(appendText(valueRef.current, text)),
  });

  useEffect(() => {
    if (disabled && listening) stop();
  }, [disabled, listening, stop]);

  const styles = TONE_STYLES[tone];
  const statusId = `${id}-voice-status`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={`block text-xs font-semibold mb-1 ${styles.label}`}>
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          id={id}
          rows={rows}
          value={value}
          required={required}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={statusId}
          className={`block w-full rounded-xl border p-3 pr-14 text-sm text-slate-900 focus:outline-none focus:ring-2 disabled:bg-slate-100 ${
            invalid ? 'border-red-500 ring-1 ring-red-500' : styles.field
          } ${listening ? 'ring-2 ring-red-500 border-red-400' : ''} ${textareaClassName}`}
        />

        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-pressed={listening}
          aria-label={
            listening ? 'Stop voice input' : supported ? 'Start voice input' : 'Voice input unavailable'
          }
          title={
            listening ? 'Stop voice input' : supported ? 'Speak to type' : 'Voice input not supported in this browser'
          }
          className={`absolute right-1.5 bottom-1.5 w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 ${
            listening
              ? 'bg-red-600 text-white shadow-[0_0_0_4px_rgba(220,38,38,0.2)] animate-pulse'
              : supported
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}
        >
          {listening ? (
            <Square className="w-4 h-4 fill-current" />
          ) : supported ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </button>
      </div>

      <div id={statusId} aria-live="polite" className="empty:hidden">
        {listening && (
          <div className="mt-1.5 flex items-start gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-red-700 shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              Listening…
            </span>
            <span className="text-slate-500 italic min-w-0 break-words">
              {interim || 'Speak now. Tap the stop button when finished.'}
            </span>
          </div>
        )}
        {!listening && error && (
          <div className="mt-1.5 flex items-start justify-between gap-2 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs text-amber-900">
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="shrink-0 font-semibold text-amber-800 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {hint && !listening && !error && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((phrase) => (
            <button
              key={phrase}
              type="button"
              disabled={disabled}
              onClick={() => onChange(appendPhrase(value, phrase))}
              className={`min-h-[36px] px-3 rounded-lg border text-xs font-medium transition-colors ${styles.chip}`}
            >
              + {phrase}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
