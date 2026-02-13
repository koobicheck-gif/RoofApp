import { useState } from 'react';
import { Card, CardHeader, Button, Select } from '../ui';
import { useAllEstimates, useEstimate } from '../../context/EstimateContext';
import { usePricing } from '../../context/PricingContext';
import { useJobs } from '../../context/JobsContext';
import { calculateEstimate, formatCurrency, formatDate } from '../../utils/calculateEstimate';
import type { Estimate, JobSchedule, JobTimelineEvent } from '../../types';

interface JobDetailViewProps {
  jobId: string;
  onBack: () => void;
}

export function JobDetailView({ jobId, onBack }: JobDetailViewProps) {
  const estimates = useAllEstimates();
  const { dispatch: estimateDispatch } = useEstimate();
  const { state: pricingState } = usePricing();
  const { dispatch: jobsDispatch, getSchedule, getTimeline, getCrewMember, getActiveCrew } = useJobs();

  const job = estimates.find((e) => e.id === jobId);
  const schedule = getSchedule(jobId);
  const timeline = getTimeline(jobId);
  const activeCrew = getActiveCrew();

  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<JobSchedule>({
    scheduledDate: schedule?.scheduledDate || '',
    scheduledTime: schedule?.scheduledTime || '08:00',
    estimatedDuration: schedule?.estimatedDuration || 4,
    crewIds: schedule?.crewIds || [],
  });
  const [note, setNote] = useState('');

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center py-8">
          <p className="text-gray-500">Job not found</p>
          <Button className="mt-4" onClick={onBack}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const calculation = calculateEstimate({
    estimate: job,
    shinglePricing: pricingState.shinglePricing,
    additionalRepairs: pricingState.additionalRepairs,
    pitchMultipliers: pricingState.pitchMultipliers,
    accessibilityMultipliers: pricingState.accessibilityMultipliers,
    fixedFees: pricingState.fixedFees,
    warrantyOptions: pricingState.warrantyOptions,
  });

  const handleStatusChange = (newStatus: Estimate['status']) => {
    const event: JobTimelineEvent = {
      id: `event-${Date.now()}`,
      timestamp: new Date(),
      type: 'status_change',
      description: `Status changed from ${job.status} to ${newStatus}`,
      oldValue: job.status,
      newValue: newStatus,
    };
    jobsDispatch({ type: 'ADD_TIMELINE_EVENT', payload: { estimateId: jobId, event } });
    estimateDispatch({ type: 'UPDATE_ESTIMATE_STATUS', payload: { id: jobId, status: newStatus } });
  };

  const handleSaveSchedule = () => {
    const event: JobTimelineEvent = {
      id: `event-${Date.now()}`,
      timestamp: new Date(),
      type: 'schedule',
      description: schedule
        ? `Rescheduled to ${scheduleForm.scheduledDate} at ${scheduleForm.scheduledTime}`
        : `Scheduled for ${scheduleForm.scheduledDate} at ${scheduleForm.scheduledTime}`,
    };
    jobsDispatch({ type: 'SET_SCHEDULE', payload: { estimateId: jobId, schedule: scheduleForm } });
    jobsDispatch({ type: 'ADD_TIMELINE_EVENT', payload: { estimateId: jobId, event } });

    if (job.status === 'approved') {
      handleStatusChange('scheduled');
    }
    setIsScheduling(false);
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    const event: JobTimelineEvent = {
      id: `event-${Date.now()}`,
      timestamp: new Date(),
      type: 'note',
      description: note,
    };
    jobsDispatch({ type: 'ADD_TIMELINE_EVENT', payload: { estimateId: jobId, event } });
    setNote('');
  };

  const handleCrewToggle = (crewId: string) => {
    setScheduleForm((prev) => ({
      ...prev,
      crewIds: prev.crewIds.includes(crewId)
        ? prev.crewIds.filter((id) => id !== crewId)
        : [...prev.crewIds, crewId],
    }));
  };

  const getStatusColor = (status: Estimate['status']): string => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'scheduled': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'invoiced': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEventIcon = (type: JobTimelineEvent['type']) => {
    switch (type) {
      case 'status_change':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'schedule':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'note':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#00224a] text-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">{job.customer.name}</h1>
              <p className="text-white/70 text-sm">{job.estimateNumber}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status & Amount */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(job.status)}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
              <div className="mt-2 text-sm text-gray-500">
                Created {formatDate(job.createdAt)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(calculation.grandTotal)}
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            {job.status === 'approved' && (
              <>
                <Button size="sm" onClick={() => setIsScheduling(true)}>
                  Schedule Job
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleStatusChange('void')}>
                  Void
                </Button>
              </>
            )}
            {job.status === 'scheduled' && (
              <>
                <Button size="sm" onClick={() => handleStatusChange('completed')}>
                  Mark Complete
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsScheduling(true)}>
                  Reschedule
                </Button>
              </>
            )}
            {job.status === 'completed' && (
              <Button size="sm" onClick={() => handleStatusChange('invoiced')}>
                Create Invoice
              </Button>
            )}
          </div>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader title="Customer Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Address</div>
              <div className="font-medium">{job.customer.address}</div>
              <div className="text-gray-600">{job.customer.city}, {job.customer.state} {job.customer.zip}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Contact</div>
              <div className="font-medium">{job.customer.phone}</div>
              <div className="text-gray-600">{job.customer.email}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <a
              href={`tel:${job.customer.phone}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </a>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(`${job.customer.address}, ${job.customer.city}, ${job.customer.state} ${job.customer.zip}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Directions
            </a>
          </div>
        </Card>

        {/* Schedule */}
        {schedule && !isScheduling && (
          <Card>
            <CardHeader
              title="Schedule"
              action={
                <Button variant="outline" size="sm" onClick={() => setIsScheduling(true)}>
                  Edit
                </Button>
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Date & Time</div>
                <div className="font-medium text-purple-600">
                  {formatDate(new Date(schedule.scheduledDate))} at {schedule.scheduledTime}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Duration</div>
                <div className="font-medium">{schedule.estimatedDuration} hours</div>
              </div>
            </div>
            {schedule.crewIds.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-2">Assigned Crew</div>
                <div className="flex flex-wrap gap-2">
                  {schedule.crewIds.map((id) => {
                    const member = getCrewMember(id);
                    return member ? (
                      <span key={id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {member.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Schedule Form */}
        {isScheduling && (
          <Card>
            <CardHeader title={schedule ? 'Reschedule Job' : 'Schedule Job'} />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduleForm.scheduledDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <Select
                    value={scheduleForm.scheduledTime}
                    onChange={(value) => setScheduleForm({ ...scheduleForm, scheduledTime: value })}
                    options={[
                      { value: '07:00', label: '7:00 AM' },
                      { value: '08:00', label: '8:00 AM' },
                      { value: '09:00', label: '9:00 AM' },
                      { value: '10:00', label: '10:00 AM' },
                      { value: '11:00', label: '11:00 AM' },
                      { value: '12:00', label: '12:00 PM' },
                      { value: '13:00', label: '1:00 PM' },
                      { value: '14:00', label: '2:00 PM' },
                      { value: '15:00', label: '3:00 PM' },
                      { value: '16:00', label: '4:00 PM' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (hours)
                </label>
                <Select
                  value={scheduleForm.estimatedDuration.toString()}
                  onChange={(value) => setScheduleForm({ ...scheduleForm, estimatedDuration: parseInt(value) })}
                  options={[
                    { value: '2', label: '2 hours' },
                    { value: '3', label: '3 hours' },
                    { value: '4', label: '4 hours' },
                    { value: '5', label: '5 hours' },
                    { value: '6', label: '6 hours' },
                    { value: '8', label: 'Full day (8 hours)' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Crew</label>
                <div className="space-y-2">
                  {activeCrew.map((member) => (
                    <label
                      key={member.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        scheduleForm.crewIds.includes(member.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={scheduleForm.crewIds.includes(member.id)}
                        onChange={() => handleCrewToggle(member.id)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.role} • {member.phone}</div>
                      </div>
                      {scheduleForm.crewIds.includes(member.id) && (
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsScheduling(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSchedule} disabled={!scheduleForm.scheduledDate}>
                  Save Schedule
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Add Note */}
        <Card>
          <CardHeader title="Add Note" />
          <div className="flex gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this job..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <Button onClick={handleAddNote} disabled={!note.trim()}>
              Add
            </Button>
          </div>
        </Card>

        {/* Timeline */}
        {timeline.length > 0 && (
          <Card>
            <CardHeader title="Timeline" />
            <div className="space-y-4">
              {[...timeline].reverse().map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{event.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tech Notes */}
        {job.techNotes && (
          <Card>
            <CardHeader title="Technician Notes" />
            <p className="text-gray-700 whitespace-pre-wrap">{job.techNotes}</p>
          </Card>
        )}
      </main>
    </div>
  );
}
