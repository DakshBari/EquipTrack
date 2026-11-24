import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { ChecklistItemTemplate, EquipmentType } from '../../types';
import { formatDateTime } from '../../utils/formatters';

const TYPES: EquipmentType[] = ['Forklift', 'Baler', 'Loader', 'Truck'];

export function AdminTemplatesPage() {
  const { state, updateTemplateItems } = useEquipTrack();
  const [selectedType, setSelectedType] = useState<EquipmentType>('Forklift');
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('Safety');
  const [newMandatory, setNewMandatory] = useState(true);
  const [newRequireNotes, setNewRequireNotes] = useState(true);
  const [newRequirePhoto, setNewRequirePhoto] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const template = state.templates[selectedType];

  const notifySaved = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const item: ChecklistItemTemplate = {
      id: `${selectedType.toLowerCase()}-${Date.now()}`,
      label: newLabel.trim(),
      category: newCategory.trim() || 'General',
      mandatory: newMandatory,
      requireNotesOnFail: newRequireNotes,
      requirePhotoOnFail: newRequirePhoto,
    };
    updateTemplateItems(selectedType, [...template.items, item]);
    setNewLabel('');
    notifySaved(`Added "${item.label}" to ${selectedType} checklist.`);
  };

  const updateItem = (itemId: string, patch: Partial<ChecklistItemTemplate>) => {
    const next = template.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
    updateTemplateItems(selectedType, next);
    notifySaved(`${selectedType} template updated.`);
  };

  const deleteItem = (itemId: string) => {
    const next = template.items.filter((item) => item.id !== itemId);
    updateTemplateItems(selectedType, next);
    notifySaved(`Removed check from ${selectedType} template.`);
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= template.items.length) return;
    const copy = [...template.items];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    updateTemplateItems(selectedType, copy);
  };

  return (
    <DashboardLayout mode="admin" title="Checklist Templates">
      <div className="space-y-5">
        {/* Equipment Type Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
            {TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`min-h-[40px] px-4 rounded-lg text-xs font-semibold transition-colors ${
                  selectedType === type
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type} ({state.templates[type].items.length})
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500">
            Last modified: <span className="font-mono">{formatDateTime(template.updatedAt)}</span>
          </div>
        </div>

        {savedNotice && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-semibold text-emerald-800">
            {savedNotice} Changes apply immediately to future operator pre-start inspections.
          </div>
        )}

        {/* Add New Checklist Item */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Add Check to {selectedType} Template
          </h2>
          <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Checklist Item Label
              </label>
              <input
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Fire extinguisher tag & gauge"
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div className="md:col-span-3 flex flex-wrap items-center gap-3 min-h-[42px] text-xs font-medium text-slate-700">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMandatory}
                  onChange={(e) => setNewMandatory(e.target.checked)}
                />
                Mandatory
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRequireNotes}
                  onChange={(e) => setNewRequireNotes(e.target.checked)}
                />
                Notes on fail
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRequirePhoto}
                  onChange={(e) => setNewRequirePhoto(e.target.checked)}
                />
                Photo on fail
              </label>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full min-h-[42px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </form>
        </section>

        {/* Editable Checklist Items */}
        <section className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {template.items.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs font-mono text-slate-400 w-6 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <input
                  value={item.label}
                  onChange={(e) => updateItem(item.id, { label: e.target.value })}
                  className="flex-1 min-w-0 min-h-[38px] px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-900"
                />
                <input
                  value={item.category}
                  onChange={(e) => updateItem(item.id, { category: e.target.value })}
                  className="w-32 min-h-[38px] px-2.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={item.mandatory}
                    onChange={(e) => updateItem(item.id, { mandatory: e.target.checked })}
                  />
                  Mandatory
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={item.requireNotesOnFail}
                    onChange={(e) => updateItem(item.id, { requireNotesOnFail: e.target.checked })}
                  />
                  Require Notes
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={item.requirePhotoOnFail}
                    onChange={(e) => updateItem(item.id, { requirePhotoOnFail: e.target.checked })}
                  />
                  Photo Flag
                </label>

                <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move up"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === template.items.length - 1}
                    aria-label="Move down"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    aria-label="Delete item"
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
