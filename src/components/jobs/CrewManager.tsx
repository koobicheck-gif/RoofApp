import { useState } from 'react';
import { Card, CardHeader, Button, Select } from '../ui';
import { useJobs } from '../../context/JobsContext';
import type { CrewMember } from '../../types';

const SPECIALTY_OPTIONS = [
  'Shingle Repair',
  'Flat Roof / TPO',
  'EPDM Systems',
  'Metal Roofing',
  'Flashing & Sealing',
  'Gutter Systems',
  'Skylight Install',
  'Emergency Tarping',
  'Inspection / Assessment',
  'Coating Application',
];

const CERT_OPTIONS = [
  'OSHA 10-Hour',
  'OSHA 30-Hour',
  'GAF Certified',
  'CertainTeed SELECT',
  'Owens Corning Preferred',
  'TPO Certified',
  'EPDM Certified',
  'Fall Protection',
  'First Aid / CPR',
  'Lift / Crane Operator',
];

export function CrewManager() {
  const { state, dispatch } = useJobs();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDaysOff, setShowDaysOff] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CrewMember, 'id'>>({
    name: '',
    phone: '',
    email: '',
    role: 'technician',
    active: true,
    specialties: [],
    hourlyRate: 0,
    certifications: [],
    notes: '',
    daysOff: [],
  });

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', role: 'technician', active: true, specialties: [], hourlyRate: 0, certifications: [], notes: '', daysOff: [] });
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
      email: member.email || '',
      role: member.role,
      active: member.active,
      specialties: member.specialties || [],
      hourlyRate: member.hourlyRate || 0,
      certifications: member.certifications || [],
      notes: member.notes || '',
      daysOff: member.daysOff || [],
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

  const toggleSpecialty = (specialty: string) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties?.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...(prev.specialties || []), specialty],
    }));
  };

  const toggleCertification = (cert: string) => {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications?.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...(prev.certifications || []), cert],
    }));
  };

  const handleAddDayOff = (memberId: string, date: string) => {
    const member = state.crew.find((c) => c.id === memberId);
    if (!member) return;
    const daysOff = member.daysOff || [];
    if (!daysOff.includes(date)) {
      dispatch({
        type: 'UPDATE_CREW_MEMBER',
        payload: { ...member, daysOff: [...daysOff, date] },
      });
    }
  };

  const handleRemoveDayOff = (memberId: string, date: string) => {
    const member = state.crew.find((c) => c.id === memberId);
    if (!member) return;
    dispatch({
      type: 'UPDATE_CREW_MEMBER',
      payload: { ...member, daysOff: (member.daysOff || []).filter((d) => d !== date) },
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
  const totalHourlyRate = activeCrew.reduce((sum, c) => sum + (c.hourlyRate || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">
            ${totalHourlyRate.toFixed(0)}
          </div>
          <div className="text-sm text-gray-500">Team Rate/hr</div>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <Card>
          <CardHeader title={editingId ? 'Edit Crew Member' : 'Add Crew Member'} />
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter name"
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                value={form.hourlyRate || ''}
                onChange={(e) => setForm({ ...form, hourlyRate: parseFloat(e.target.value) || 0 })}
                placeholder="25.00"
                min="0"
                step="0.50"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map((specialty) => (
                  <button
                    key={specialty}
                    onClick={() => toggleSpecialty(specialty)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      form.specialties?.includes(specialty)
                        ? 'bg-purple-100 text-purple-700 border-purple-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
              <div className="flex flex-wrap gap-2">
                {CERT_OPTIONS.map((cert) => (
                  <button
                    key={cert}
                    onClick={() => toggleCertification(cert)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      form.certifications?.includes(cert)
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {cert}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes about this crew member..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
          <div className="space-y-3">
            {activeCrew.map((member) => (
              <div key={member.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">
                        {member.phone}
                        {member.hourlyRate ? ` • $${member.hourlyRate}/hr` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(member.role)}`}>
                      {member.role === 'lead' ? 'Lead' : member.role === 'technician' ? 'Tech' : 'Helper'}
                    </span>
                    <button
                      onClick={() => setShowDaysOff(showDaysOff === member.id ? null : member.id)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                      title="Schedule days off"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
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

                {/* Specialties & Certs Row */}
                {((member.specialties && member.specialties.length > 0) || (member.certifications && member.certifications.length > 0)) && (
                  <div className="px-3 py-2 border-t border-gray-100">
                    {member.specialties && member.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {member.specialties.map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {member.certifications && member.certifications.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {member.certifications.map((c) => (
                          <span key={c} className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Days Off Scheduler */}
                {showDaysOff === member.id && (
                  <div className="px-3 py-3 border-t border-gray-100 bg-amber-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Days Off / Unavailable</span>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddDayOff(member.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    {(member.daysOff || []).length === 0 ? (
                      <p className="text-xs text-gray-400">No days off scheduled. Use the date picker to add.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(member.daysOff || [])
                          .sort()
                          .filter((d) => d >= new Date().toISOString().split('T')[0])
                          .map((date) => (
                            <span
                              key={date}
                              className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded"
                            >
                              {new Date(date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              <button
                                onClick={() => handleRemoveDayOff(member.id, date)}
                                className="ml-0.5 hover:text-red-600"
                              >
                                x
                              </button>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}
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
