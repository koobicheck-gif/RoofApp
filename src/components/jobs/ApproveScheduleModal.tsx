import { useState } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { useEstimate } from '../../context/EstimateContext';
import { usePricing } from '../../context/PricingContext';
import { useJobs } from '../../context/JobsContext';
import { calculateEstimate, formatCurrency } from '../../utils/calculateEstimate';
import type { Estimate, JobSchedule, JobTimelineEvent } from '../../types';

interface ApproveScheduleModalProps {
  estimate: Estimate;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ApproveScheduleModal({ estimate, onClose, onSuccess }: ApproveScheduleModalProps) {
  const { dispatch: estimateDispatch } = useEstimate();
  const { state: pricingState } = usePricing();
  const { state: jobsState, dispatch: jobsDispatch, getActiveCrew } = useJobs();

  const activeCrew = getActiveCrew();

  const [scheduleForm, setScheduleForm] = useState<JobSchedule>({
    scheduledDate: '',
    scheduledTime: '08:00',
    estimatedDuration: 4,
    crewIds: [],
  });
  const [step, setStep] = useState<'approve' | 'schedule'>('approve');

  const calculation = calculateEstimate({
    estimate,
    shinglePricing: pricingState.shinglePricing,
    additionalRepairs: pricingState.additionalRepairs,
    pitchMultipliers: pricingState.pitchMultipliers,
    accessibilityMultipliers: pricingState.accessibilityMultipliers,
    fixedFees: pricingState.fixedFees,
    warrantyOptions: pricingState.warrantyOptions,
  });

  // Check crew availability for the selected date
  const isCrewAvailable = (memberId: string, date: string): boolean => {
    if (!date) return true;
    const member = jobsState.crew.find((c) => c.id === memberId);
    if (!member) return false;
    if (member.daysOff?.includes(date)) return false;
    // Check if already assigned to another job on this date
    for (const [estId, sched] of Object.entries(jobsState.schedules)) {
      if (estId !== estimate.id && sched.scheduledDate === date && sched.crewIds.includes(memberId)) {
        return false;
      }
    }
    return true;
  };

  const handleCrewToggle = (crewId: string) => {
    setScheduleForm((prev) => ({
      ...prev,
      crewIds: prev.crewIds.includes(crewId)
        ? prev.crewIds.filter((id) => id !== crewId)
        : [...prev.crewIds, crewId],
    }));
  };

  const handleApproveOnly = () => {
    // Just approve without scheduling
    const event: JobTimelineEvent = {
      id: `event-${Date.now()}`,
      timestamp: new Date(),
      type: 'status_change',
      description: 'Estimate approved',
      oldValue: estimate.status,
      newValue: 'approved',
    };
    jobsDispatch({ type: 'ADD_TIMELINE_EVENT', payload: { estimateId: estimate.id, event } });
    estimateDispatch({ type: 'UPDATE_ESTIMATE_STATUS', payload: { id: estimate.id, status: 'approved' } });
    onSuccess?.();
    onClose();
  };

  const handleApproveAndSchedule = () => {
    // Approve the estimate
    const approveEvent: JobTimelineEvent = {
      id: `event-${Date.now()}`,
      timestamp: new Date(),
      type: 'status_change',
      description: 'Estimate approved',
      oldValue: estimate.status,
      newValue: 'approved',
    };
    jobsDispatch({ type: 'ADD_TIMELINE_EVENT', payload: { estimateId: estimate.id, event: approveEvent } });

    // Schedule the job
    const scheduleEvent: JobTimelineEvent = {
      id: `event-${Date.now() + 1}`,
      timestamp: new Date(),
      type: 'schedule',
      description: `Scheduled for ${scheduleForm.scheduledDate} at ${scheduleForm.scheduledTime} with ${scheduleForm.crewIds.length} crew member(s)`,
    };
    jobsDispatch({ type: 'SET_SCHEDULE', payload: { estimateId: estimate.id, schedule: scheduleForm } });
    jobsDispatch({ type: 'ADD_TIMELINE_EVENT', payload: { estimateId: estimate.id, event: scheduleEvent } });

    // Update status to scheduled
    estimateDispatch({ type: 'UPDATE_ESTIMATE_STATUS', payload: { id: estimate.id, status: 'scheduled' } });

    onSuccess?.();
    onClose();
  };

  const selectedCrewNames = scheduleForm.crewIds
    .map((id) => activeCrew.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  const estimatedCrewCost = scheduleForm.crewIds.reduce((sum, id) => {
    const member = activeCrew.find((c) => c.id === id);
    return sum + (member?.hourlyRate || 0) * scheduleForm.estimatedDuration;
  }, 0);

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader
          title={step === 'approve' ? 'Approve Estimate' : 'Schedule Job'}
          subtitle={estimate.customer.name}
        />

        {/* Estimate Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm text-gray-500">{estimate.estimateNumber}</p>
              <p className="font-medium">{estimate.customer.address}</p>
              {estimate.customer.city && (
                <p className="text-sm text-gray-500">
                  {estimate.customer.city}, {estimate.customer.state} {estimate.customer.zip}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#00224a]">{formatCurrency(calculation.grandTotal)}</p>
              <p className="text-xs text-gray-500">{estimate.roofType === 'commercial' ? 'Commercial' : 'Residential'}</p>
            </div>
          </div>
        </div>

        {step === 'approve' ? (
          <>
            {/* Approval Step */}
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-green-800">Ready to Approve?</p>
                    <p className="text-sm text-green-600 mt-1">
                      Once approved, this estimate will be available for scheduling and will appear in the Jobs dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {estimate.customer.phone && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Phone:</span> {estimate.customer.phone}
                </p>
              )}
              {estimate.customer.email && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Email:</span> {estimate.customer.email}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button variant="outline" onClick={handleApproveOnly} className="flex-1">
                Approve Only
              </Button>
              <Button onClick={() => setStep('schedule')} className="flex-1 bg-[#00224a]">
                Approve & Schedule
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Schedule Step */}
            <div className="space-y-4 mb-6">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={scheduleForm.scheduledDate}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.scheduledTime}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduledTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={scheduleForm.estimatedDuration}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 4 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Crew Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Crew *
                </label>
                {activeCrew.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                    No active crew members. Add crew in the Crew Manager first.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {activeCrew.map((member) => {
                      const isSelected = scheduleForm.crewIds.includes(member.id);
                      const available = isCrewAvailable(member.id, scheduleForm.scheduledDate);
                      const isLead = member.role === 'lead';

                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => available && handleCrewToggle(member.id)}
                          disabled={!available}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : available
                              ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                isSelected ? 'bg-blue-600' : 'bg-gray-400'
                              }`}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900">
                                {member.name}
                                {isLead && (
                                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                                    Lead
                                  </span>
                                )}
                              </p>
                              {member.specialties && member.specialties.length > 0 && (
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {member.specialties.slice(0, 2).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!available && (
                              <span className="text-xs text-red-500">Unavailable</span>
                            )}
                            {member.hourlyRate && (
                              <span className="text-xs text-gray-400">
                                ${member.hourlyRate}/hr
                              </span>
                            )}
                            {isSelected && (
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary */}
              {scheduleForm.crewIds.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Assigned:</span> {selectedCrewNames}
                  </p>
                  {estimatedCrewCost > 0 && (
                    <p className="text-sm text-blue-600 mt-1">
                      <span className="font-medium">Est. Labor Cost:</span> {formatCurrency(estimatedCrewCost)} ({scheduleForm.estimatedDuration} hrs)
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('approve')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleApproveAndSchedule}
                disabled={!scheduleForm.scheduledDate || scheduleForm.crewIds.length === 0}
                className="flex-1 bg-[#00224a] disabled:opacity-50"
              >
                Confirm & Schedule
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
