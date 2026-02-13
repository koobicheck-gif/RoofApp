import { useState } from 'react';
import { Card, CardHeader, Button, Select } from '../ui';
import { useJobs } from '../../context/JobsContext';
import type { CrewMember } from '../../types';

export function CrewManager() {
  const { state, dispatch } = useJobs();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CrewMember, 'id'>>({
    name: '',
    phone: '',
    role: 'technician',
    active: true,
  });

  const resetForm = () => {
    setForm({ name: '', phone: '', role: 'technician', active: true });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!form.name.trim()) return;

    const newMember: CrewMember = {
      id: `crew-${Date.now()}`,
      ...form,
    };

    dispatch({ type: 'ADD_CREW_MEMBER', payload: newMember });
    resetForm();
  };

  const handleEdit = (member: CrewMember) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      phone: member.phone,
      role: member.role,
      active: member.active,
    });
  };

  const handleUpdate = () => {
    if (!editingId || !form.name.trim()) return;

    dispatch({
      type: 'UPDATE_CREW_MEMBER',
      payload: { id: editingId, ...form },
    });
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this crew member?')) {
      dispatch({ type: 'DELETE_CREW_MEMBER', payload: id });
    }
  };

  const handleToggleActive = (member: CrewMember) => {
    dispatch({
      type: 'UPDATE_CREW_MEMBER',
      payload: { ...member, active: !member.active },
    });
  };

  const getRoleBadgeColor = (role: CrewMember['role']) => {
    switch (role) {
      case 'lead':
        return 'bg-purple-100 text-purple-700';
      case 'technician':
        return 'bg-blue-100 text-blue-700';
      case 'helper':
        return 'bg-gray-100 text-gray-700';
    }
  };

  const activeCrew = state.crew.filter((c) => c.active);
  const inactiveCrew = state.crew.filter((c) => !c.active);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">{activeCrew.length}</div>
          <div className="text-sm text-gray-500">Active Crew</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {activeCrew.filter((c) => c.role === 'lead').length}
          </div>
          <div className="text-sm text-gray-500">Team Leads</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {activeCrew.filter((c) => c.role === 'technician').length}
          </div>
          <div className="text-sm text-gray-500">Technicians</div>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <Card>
          <CardHeader title={editingId ? 'Edit Crew Member' : 'Add Crew Member'} />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(555) 555-5555"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <Select
                value={form.role}
                onChange={(value) => setForm({ ...form, role: value as CrewMember['role'] })}
                options={[
                  { value: 'lead', label: 'Team Lead' },
                  { value: 'technician', label: 'Technician' },
                  { value: 'helper', label: 'Helper' },
                ]}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={editingId ? handleUpdate : handleAdd} disabled={!form.name.trim()}>
                {editingId ? 'Update' : 'Add'} Member
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Active Crew */}
      <Card>
        <CardHeader
          title="Active Crew"
          subtitle={`${activeCrew.length} members`}
          action={
            !isAdding && !editingId && (
              <Button size="sm" onClick={() => setIsAdding(true)}>
                Add Member
              </Button>
            )
          }
        />
        {activeCrew.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No active crew members</p>
        ) : (
          <div className="space-y-2">
            {activeCrew.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(member.role)}`}>
                    {member.role === 'lead' ? 'Lead' : member.role === 'technician' ? 'Tech' : 'Helper'}
                  </span>
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggleActive(member)}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                    title="Deactivate"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Inactive Crew */}
      {inactiveCrew.length > 0 && (
        <Card>
          <CardHeader
            title="Inactive Crew"
            subtitle={`${inactiveCrew.length} members`}
          />
          <div className="space-y-2">
            {inactiveCrew.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">{member.name}</div>
                    <div className="text-sm text-gray-400">{member.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(member)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Reactivate
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
