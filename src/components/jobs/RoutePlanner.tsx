import { useState, useMemo } from 'react';
import { Card, Button } from '../ui';
import { GoogleRouteMap } from './GoogleRouteMap';
import type { RouteJob } from './GoogleRouteMap';
import { useAllEstimates } from '../../context/EstimateContext';
import { usePricing } from '../../context/PricingContext';
import { useJobs } from '../../context/JobsContext';
import { calculateEstimate, formatCurrency } from '../../utils/calculateEstimate';
import type { Estimate } from '../../types';

interface RoutePlannerProps {
  onSelectJob?: (jobId: string) => void;
}

export function RoutePlanner({ onSelectJob }: RoutePlannerProps) {
  const estimates = useAllEstimates();
  const { state: pricingState } = usePricing();
  const { getSchedule, getCrewMember } = useJobs();

  // Track which jobs are toggled for route
  const [toggledJobIds, setToggledJobIds] = useState<Set<string>>(new Set());

  // Filter to show only scheduled jobs (jobs that can be routed)
  const scheduledJobs = useMemo(() => {
    return estimates.filter(
      (e) => ['scheduled', 'approved'].includes(e.status) && getSchedule(e.id)
    );
  }, [estimates, getSchedule]);

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const groups: Record<string, Estimate[]> = {};

    scheduledJobs.forEach((job) => {
      const schedule = getSchedule(job.id);
      if (schedule) {
        const date = schedule.scheduledDate;
        if (!groups[date]) groups[date] = [];
        groups[date].push(job);
      }
    });

    // Sort by date
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [scheduledJobs, getSchedule]);

  // Convert toggled jobs to RouteJob format for the map
  const routeJobs: RouteJob[] = useMemo(() => {
    return scheduledJobs.map((job) => ({
      id: job.id,
      label: job.customer.name || 'Unnamed Job',
      address: `${job.customer.address}, ${job.customer.city}, ${job.customer.state} ${job.customer.zip}`,
      toggled: toggledJobIds.has(job.id)
    }));
  }, [scheduledJobs, toggledJobIds]);

  const handleToggle = (jobId: string) => {
    setToggledJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const handleSelectAllDate = (date: string) => {
    const jobsForDate = jobsByDate.find(([d]) => d === date)?.[1] || [];
    const allSelected = jobsForDate.every((job) => toggledJobIds.has(job.id));

    setToggledJobIds((prev) => {
      const next = new Set(prev);
      jobsForDate.forEach((job) => {
        if (allSelected) {
          next.delete(job.id);
        } else {
          next.add(job.id);
        }
      });
      return next;
    });
  };

  const handleClearAll = () => {
    setToggledJobIds(new Set());
  };

  const getEstimateTotal = (estimate: Estimate): number => {
    const calculation = calculateEstimate({
      estimate,
      shinglePricing: pricingState.shinglePricing,
      additionalRepairs: pricingState.additionalRepairs,
      pitchMultipliers: pricingState.pitchMultipliers,
      accessibilityMultipliers: pricingState.accessibilityMultipliers,
      fixedFees: pricingState.fixedFees,
      warrantyOptions: pricingState.warrantyOptions,
    });
    return calculation.grandTotal;
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    }
    if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggledCount = toggledJobIds.size;
  const toggledTotal = routeJobs
    .filter((j) => j.toggled)
    .reduce((sum, j) => {
      const est = scheduledJobs.find((e) => e.id === j.id);
      return sum + (est ? getEstimateTotal(est) : 0);
    }, 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">{scheduledJobs.length}</div>
          <div className="text-xs text-gray-500">Scheduled Jobs</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">{toggledCount}</div>
          <div className="text-xs text-gray-500">In Route</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(toggledTotal)}</div>
          <div className="text-xs text-gray-500">Route Value</div>
        </Card>
      </div>

      {/* Map */}
      <GoogleRouteMap jobs={routeJobs} height="350px" />

      {/* Job List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Select Jobs for Route</h3>
          {toggledCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>

        {scheduledJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No scheduled jobs available.</p>
            <p className="text-sm mt-1">Approve and schedule estimates first.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobsByDate.map(([date, jobs]) => {
              const allSelected = jobs.every((job) => toggledJobIds.has(job.id));
              const someSelected = jobs.some((job) => toggledJobIds.has(job.id));

              return (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDateHeader(date)}
                      <span className="text-gray-400 font-normal">({jobs.length} jobs)</span>
                    </h4>
                    <button
                      onClick={() => handleSelectAllDate(date)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        allSelected
                          ? 'bg-blue-100 text-blue-700'
                          : someSelected
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {/* Jobs for this date */}
                  <div className="space-y-2">
                    {jobs.map((job) => {
                      const schedule = getSchedule(job.id);
                      const isToggled = toggledJobIds.has(job.id);
                      const crewMembers = schedule?.crewIds
                        .map((id) => getCrewMember(id))
                        .filter(Boolean) || [];

                      return (
                        <div
                          key={job.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            isToggled
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {/* Toggle Switch */}
                          <button
                            onClick={() => handleToggle(job.id)}
                            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                              isToggled ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                isToggled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          {/* Job Info */}
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => onSelectJob?.(job.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">
                                {job.customer.name || 'Unnamed'}
                              </span>
                              {schedule && (
                                <span className="text-xs text-gray-500">
                                  {schedule.scheduledTime}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {job.customer.address}, {job.customer.city}
                            </p>
                            {crewMembers.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-xs text-gray-400">
                                  {crewMembers.map((c) => c!.name.split(' ')[0]).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Job Value */}
                          <div className="text-right flex-shrink-0">
                            <span className="font-semibold text-[#00224a]">
                              {formatCurrency(getEstimateTotal(job))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
