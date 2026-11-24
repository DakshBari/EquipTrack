import React, { useState } from 'react';
import { Edit2, Plus, Search, X } from 'lucide-react';
import { useEquipTrack } from '../../context/EquipTrackContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { SiteId, User, UserRole } from '../../types';
import { getSiteName } from '../../utils/formatters';

export function AdminUsersPage() {
  const { state, selectedSite, addUser, updateUser } = useEquipTrack();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [roleTitle, setRoleTitle] = useState('Equipment Operator');
  const [siteId, setSiteId] = useState<SiteId>('canning-vale');
  const [phone, setPhone] = useState('+61 400 000 000');

  const openAdd = () => {
    setEditing(null);
    setName('');
    setEmail('');
    setRole('operator');
    setRoleTitle('Equipment Operator');
    setSiteId('canning-vale');
    setPhone('+61 412 555 888');
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setRoleTitle(u.roleTitle);
    setSiteId(u.siteId);
    setPhone(u.phone);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateUser({
        ...editing,
        name: name.trim(),
        email: email.trim(),
        role,
        roleTitle: roleTitle.trim(),
        siteId,
        phone: phone.trim(),
      });
    } else {
      addUser({
        name: name.trim(),
        email: email.trim(),
        role,
        roleTitle: roleTitle.trim(),
        siteId,
        phone: phone.trim(),
        active: true,
      });
    }
    setShowModal(false);
  };

  const filtered = state.users.filter((u) => {
    if (selectedSite !== 'all' && u.siteId !== selectedSite) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roleTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardLayout mode="admin" title="Users & Roles">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, or title..."
                className="w-full min-h-[42px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm"
              />
            </div>

            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="min-h-[42px] px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="operator">Operators</option>
              <option value="supervisor">Supervisors</option>
              <option value="admin">Company Admins</option>
            </select>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="min-h-[42px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <ul className="md:hidden divide-y divide-slate-100">
            {filtered.map((user) => (
              <li key={user.id} className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {user.roleTitle} · {getSiteName(user.siteId)}
                  </div>
                  <div className="text-xs font-mono text-slate-500 truncate">{user.email}</div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateUser({ ...user, active: !user.active })}
                    className={`min-h-[36px] px-2.5 rounded-lg text-xs font-semibold ${
                      user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {user.active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(user)}
                    className="min-h-[40px] px-3 rounded-lg border border-slate-200 text-xs font-semibold text-blue-700 hover:bg-blue-50 inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Site</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-xs font-mono text-slate-500">{user.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 capitalize">{user.role}</div>
                      <div className="text-xs text-slate-500">{user.roleTitle}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{getSiteName(user.siteId)}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">{user.phone}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => updateUser({ ...user, active: !user.active })}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          user.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {user.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="min-h-[34px] px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-blue-700 hover:bg-blue-50 inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 sm:p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-xl"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editing ? 'Edit User' : 'Add Demo User'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="operator">Operator</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Company Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Site</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value as SiteId)}
                    className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="canning-vale">Canning Vale</option>
                    <option value="jandakot">Jandakot</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  required
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-h-[40px] px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[40px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
              >
                Save User
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
