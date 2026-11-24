import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Mail,
  MessageSquare,
  Send,
  Share2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEquipTrack } from '../context/EquipTrackContext';
import { FaultRecord } from '../types';
import { buildFaultShareMessage, getSiteName } from '../utils/formatters';

interface ShareFaultModalProps {
  fault: FaultRecord;
  onClose: () => void;
}

export function ShareFaultModal({ fault, onClose }: ShareFaultModalProps) {
  const { state, recordShareFault } = useEquipTrack();
  const navigate = useNavigate();

  const [contactId, setContactId] = useState(
    fault.assignedContactId || state.maintenanceContacts[0]?.id || ''
  );
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const selectedContact =
    state.maintenanceContacts.find((c) => c.id === contactId) || state.maintenanceContacts[0];

  const faultPath = `/maintenance/fault/${fault.id}`;
  const faultUrl = `${window.location.origin}${faultPath}`;

  const defaultMessage = useMemo(
    () =>
      buildFaultShareMessage({
        equipmentName: fault.equipmentName,
        equipmentId: fault.equipmentId,
        siteName: getSiteName(fault.siteId),
        faultDescription: fault.description,
        priority: fault.severity,
        instructions: fault.supervisorInstructions,
        faultUrl,
      }),
    [fault, faultUrl]
  );

  const [customMessage, setCustomMessage] = useState(defaultMessage);

  const channels: ('SMS' | 'Email')[] = [];
  if (sendSms) channels.push('SMS');
  if (sendEmail) channels.push('Email');

  const logDispatch = () => {
    if (!selectedContact || channels.length === 0) return;
    recordShareFault({
      faultId: fault.id,
      contactId: selectedContact.id,
      contactName: selectedContact.name,
      channels,
      message: customMessage,
    });
  };

  const handleOpenSms = () => {
    if (!selectedContact) return;
    logDispatch();
    const smsHref = `sms:${selectedContact.phone.replace(/\s+/g, '')}?body=${encodeURIComponent(
      customMessage
    )}`;
    window.location.href = smsHref;
    setSentNotice(`SMS draft prepared for ${selectedContact.name} (${selectedContact.phone}).`);
  };

  const handleOpenEmail = () => {
    if (!selectedContact) return;
    logDispatch();
    const subject = `[EquipTrack ${fault.severity}] ${fault.equipmentName} (${fault.equipmentId}) — ${fault.id}`;
    const mailtoHref = `mailto:${selectedContact.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(customMessage)}`;
    window.location.href = mailtoHref;
    setSentNotice(`Email draft prepared for ${selectedContact.name} (${selectedContact.email}).`);
  };

  const handleBothOrNativeShare = async () => {
    if (!selectedContact || channels.length === 0) return;
    logDispatch();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Fault Report ${fault.id} — ${fault.equipmentId}`,
          text: customMessage,
          url: faultUrl,
        });
        setSentNotice(`Shared fault report with ${selectedContact.name}.`);
        return;
      } catch {
        // Fallback below
      }
    }

    if (sendEmail) {
      const subject = `[EquipTrack ${fault.severity}] ${fault.equipmentName} (${fault.equipmentId}) — ${fault.id}`;
      window.location.href = `mailto:${selectedContact.email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(customMessage)}`;
    } else if (sendSms) {
      window.location.href = `sms:${selectedContact.phone.replace(/\s+/g, '')}?body=${encodeURIComponent(
        customMessage
      )}`;
    }
    setSentNotice(
      `Fault dispatch logged (${channels.join(' & ')}) for ${selectedContact.name}. Use Copy or Open Link below if preview blocks external apps.`
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopied(true);
      logDispatch();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setSentNotice('Clipboard unavailable. Select and copy the message text manually.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Share Fault Report</h3>
            <p className="text-xs text-slate-500">
              {fault.id} · {fault.equipmentName} ({fault.equipmentId})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share modal"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Maintenance Contact
            </label>
            <div className="grid grid-cols-1 gap-2">
              {state.maintenanceContacts.map((contact) => {
                const active = contact.id === contactId;
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setContactId(contact.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                      active
                        ? 'border-blue-700 bg-blue-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{contact.name}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {contact.company} · {contact.phone} · {contact.email}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium shrink-0 ${
                        active ? 'text-blue-700' : 'text-slate-400'
                      }`}
                    >
                      {active ? 'Selected' : 'Select'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Delivery Channels
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSendSms((v) => !v)}
                className={`min-h-[40px] px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors ${
                  sendSms
                    ? 'border-blue-700 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                SMS ({selectedContact?.phone})
              </button>
              <button
                type="button"
                onClick={() => setSendEmail((v) => !v)}
                className={`min-h-[40px] px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors ${
                  sendEmail
                    ? 'border-blue-700 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email ({selectedContact?.email})
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Message Preview (Editable)
              </label>
              <span className="text-[11px] font-mono text-slate-500">{faultPath}</span>
            </div>
            <textarea
              rows={7}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">
              Review before opening your native messaging app. In production, this link uses scoped,
              time-limited contractor access tokens.
            </p>
          </div>

          {sentNotice && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800">
              {sentNotice}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Message'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(faultPath);
              }}
              className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-blue-700 hover:bg-blue-50 flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Link as Contractor
            </button>
          </div>

          <div className="flex items-center gap-2">
            {sendSms && (
              <button
                type="button"
                onClick={handleOpenSms}
                className="min-h-[40px] px-3.5 py-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Open SMS
              </button>
            )}
            {sendEmail && (
              <button
                type="button"
                onClick={handleOpenEmail}
                className="min-h-[40px] px-3.5 py-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                Open Email
              </button>
            )}
            <button
              type="button"
              disabled={channels.length === 0}
              onClick={handleBothOrNativeShare}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-40 flex items-center gap-1.5"
            >
              {typeof navigator.share === 'function' ? <Share2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              Confirm & Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
