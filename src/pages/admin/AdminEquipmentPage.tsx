import React, { useState } from 'react';
import { Edit2, Plus, QrCode, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QrCodeModal } from '../../components/QrCodeModal';
import { EquipmentStatusLabel } from '../../components/StatusBadge';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { EQUIPMENT_IMAGES } from '../../data/seedData';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Equipment, EquipmentStatus, EquipmentType, SiteId } from '../../types';
import { formatDateTime, getSiteName } from '../../utils/formatters';

export function AdminEquipmentPage() {
  const { state, selectedSite, addEquipment, updateEquipment } = useEquipTrack();
  const [search, setSearch] = useState('');
  const [qrTarget, setQrTarget] = useState<Equipment | null>(null);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<EquipmentType>('Forklift');
  const [formSite, setFormSite] = useState<SiteId>('canning-vale');
  const [formManufacturer, setFormManufacturer] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formStatus, setFormStatus] = useState<EquipmentStatus>('Operational');
  const [formHourMeter, setFormHourMeter] = useState('0');
  const [formOperatorId, setFormOperatorId] = useState('usr-op-1');

  const operators = state.users.filter((u) => u.role === 'operator');

  const openAddModal = () => {
    setEditing(null);
    setFormId(`FL-00${state.equipment.length + 1}`);
    setFormName('');
    setFormType('Forklift');
    setFormSite(selectedSite === 'all' ? 'canning-vale' : selectedSite);
    setFormManufacturer('Toyota Material Handling');
    setFormModel('8FG25');
    setFormSerial(`SN-${Date.now().toString().slice(-6)}`);
    setFormStatus('Operational');
    setFormHourMeter('100');
    setFormOperatorId(operators[0]?.id || 'usr-op-1');
    setShowAdd(true);
  };

  const openEditModal = (eq: Equipment) => {
    setEditing(eq);
    setFormId(eq.id);
    setFormName(eq.name);
    setFormType(eq.type);
    setFormSite(eq.siteId);
    setFormManufacturer(eq.manufacturer);
    setFormModel(eq.model);
    setFormSerial(eq.serialNumber);
    setFormStatus(eq.status);
    setFormHourMeter(String(eq.hourMeter));
    setFormOperatorId(eq.assignedOperatorId);
    setShowAdd(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateEquipment({
        ...editing,
        name: formName.trim(),
        type: formType,
        siteId: formSite,
        manufacturer: formManufacturer.trim(),
        model: formModel.trim(),
        serialNumber: formSerial.trim(),
        status: formStatus,
        hourMeter: Number(formHourMeter) || 0,
        assignedOperatorId: formOperatorId,
        imageUrl: EQUIPMENT_IMAGES[formType],
      });
    } else {
      addEquipment({
        id: formId.trim().toUpperCase(),
        name: formName.trim(),
        type: formType,
        siteId: formSite,
        manufacturer: formManufacturer.trim(),
        model: formModel.trim(),
        serialNumber: formSerial.trim(),
        year: 2025,
        hourMeter: Number(formHourMeter) || 0,
        status: formStatus,
        assignedOperatorId: formOperatorId,
        imageUrl: EQUIPMENT_IMAGES[formType],
      });
    }
    setShowAdd(false);
  };

  const filtered = state.equipment.filter((eq) => {
    if (selectedSite !== 'all' && eq.siteId !== selectedSite) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        eq.id.toLowerCase().includes(q) ||
        eq.name.toLowerCase().includes(q) ||
        eq.type.toLowerCase().includes(q) ||
        eq.manufacturer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardLayout mode="admin" title="Equipment & QR Management">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment ID, name, or type..."
              className="w-full min-h-[42px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm"
            />
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="min-h-[42px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Equipment
          </button>
        </div>

        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Name & Model</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Site</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Inspection</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                      {eq.id}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/supervisor/equipment/${eq.id}`}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        {eq.name}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {eq.manufacturer} {eq.model}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{eq.type}</td>
                    <td className="py-3 px-4 text-slate-600">{getSiteName(eq.siteId)}</td>
                    <td className="py-3 px-4">
                      <EquipmentStatusLabel status={eq.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {formatDateTime(eq.lastInspectionAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQrTarget(eq)}
                          className="min-h-[34px] px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          QR
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(eq)}
                          className="min-h-[34px] px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-blue-700 hover:bg-blue-50 inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Add / Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editing ? `Edit ${editing.id}` : 'Add New Equipment'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Equipment ID
                </label>
                <input
                  required
                  disabled={Boolean(editing)}
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm font-mono disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Equipment Name
                </label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Forklift 08"
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as EquipmentType)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="Forklift">Forklift</option>
                  <option value="Baler">Baler</option>
                  <option value="Loader">Loader</option>
                  <option value="Truck">Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Site</label>
                <select
                  value={formSite}
                  onChange={(e) => setFormSite(e.target.value as SiteId)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="canning-vale">Canning Vale</option>
                  <option value="jandakot">Jandakot</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manufacturer
                </label>
                <input
                  required
                  value={formManufacturer}
                  onChange={(e) => setFormManufacturer(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
                <input
                  required
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as EquipmentStatus)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="Operational">Operational</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Awaiting Return-to-Service">Awaiting Return-to-Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Operator
                </label>
                <select
                  value={formOperatorId}
                  onChange={(e) => setFormOperatorId(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name} ({getSiteName(op.siteId)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="min-h-[40px] px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[40px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
              >
                {editing ? 'Save Changes' : 'Add to Fleet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {qrTarget && <QrCodeModal equipment={qrTarget} onClose={() => setQrTarget(null)} />}
    </DashboardLayout>
  );
}
