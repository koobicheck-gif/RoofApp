import { useState, useMemo } from 'react';
import { Card, Button, Select } from '../ui';
import { useAllEstimates, useEstimate } from '../../context/EstimateContext';
import { usePricing } from '../../context/PricingContext';
import { useJobs } from '../../context/JobsContext';
import { calculateEstimate, formatCurrency, formatDate } from '../../utils/calculateEstimate';
import { ScheduleCalendar } from './ScheduleCalendar';
import { JobDetailView } from './JobDetailView';
import { CrewManager } from './CrewManager';
import type { Estimate } from '../../types';

interface JobsDashboardProps {
  onClose: () => void;
}

type ViewMode = 'list' | 'calendar' | 'crew';
type FilterStatus = 'all' | 'scheduled' | 'today' | 'this-week' | 'completed';

export function JobsDashboard({ onClose }: JobsDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const estimates = useAllEstimates();
  const { dispatch: estimateDispatch } = useEstimate();
  const { state: pricingState } = usePricing();
  const { getSchedule, getCrewMember } = useJobs();

  // Only show approved, scheduled, and completed jobs
  const jobs = useMemo(() => {
    return estimates.filter(
      (e) => ['approved', 'scheduled', 'completed', 'invoiced'].includes(e.status)
    );
  }, [estimates]);

  // Filter jobs based on status
  const filteredJobs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return jobs.filter((job) => {
      const schedule = getSchedule(job.id);

      switch (filterStatus) {
        case 'scheduled':
          return job.status === 'scheduled' && schedule;
        case 'today': {
          if (!schedule) return false;
          const schedDate = new Date(schedule.scheduledDate);
          schedDate.setHours(0, 0, 0, 0);
          return schedDate.getTime() === today.getTime();
        }
        case 'this-week': {
          if (!schedule) return false;
          const schedDate = new Date(schedule.scheduledDate);
          return schedDate >= today && schedDate < weekEnd;
        }
        case 'completed':
          return job.status === 'completed' || job.status === 'invoiced';
        default:
          return true;
      }
    });
  }, [jobs, filterStatus, getSchedule]);

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

  const getStatusColor = (status: Estimate['status']): string => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'scheduled':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'invoiced':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleStatusChange = (jobId: string, newStatus: Estimate['status']) => {
    estimateDispatch({
      type: 'UPDATE_ESTIMATE_STATUS',
      payload: { id: jobId, status: newStatus },
    });
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayCount = 0;
    let weekCount = 0;
    let scheduledRevenue = 0;
    let completedRevenue = 0;

    jobs.forEach((job) => {
      const schedule = getSchedule(job.id);
      const total = getEstimateTotal(job);

      if (job.status === 'completed' || job.status === 'invoiced') {
        completedRevenue += total;
      } else if (schedule) {
        scheduledRevenue += total;
        const schedDate = new Date(schedule.scheduledDate);
        schedDate.setHours(0, 0, 0, 0);

        if (schedDate.getTime() === today.getTime()) {
          todayCount++;
        }

        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (schedDate >= today && schedDate < weekEnd) {
          weekCount++;
        }
      }
    });

    return { todayCount, weekCount, scheduledRevenue, completedRevenue };
  }, [jobs, getSchedule, getEstimateTotal]);

  if (selectedJobId) {
    return (
      <JobDetailView
        jobId={selectedJobId}
        onBack={() => setSelectedJobId(null)}
      />
    );
  }

  if (viewMode === 'calendar') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-[#00224a] text-white">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold">Job Schedule</h1>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setViewMode('list')}>
                  List View
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setViewMode('crew')}>
                  Crew
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">
          <ScheduleCalendar onSelectJob={(id) => setSelectedJobId(id)} />
        </main>
      </div>
    );
  }

  if (viewMode === 'crew') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-[#00224a] text-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold">Crew Management</h1>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setViewMode('list')}>
                  Jobs
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setViewMode('calendar')}>
                  Calendar
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <CrewManager />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#00224a] text-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold">Jobs & Scheduling</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setViewMode('calendar')}>
                Calendar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setViewMode('crew')}>
                Crew
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.todayCount}</div>
            <div className="text-sm text-gray-500">Jobs Today</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.weekCount}</div>
            <div className="text-sm text-gray-500">This Week</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.scheduledRevenue)}</div>
            <div className="text-sm text-gray-500">Scheduled Revenue</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.completedRevenue)}</div>
            <div className="text-sm text-gray-500">Completed Revenue</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-4">
          <Select
            value={filterStatus}
            onChange={(value) => setFilterStatus(value as FilterStatus)}
            className="w-48"
            options={[
              { value: 'all', label: `All Jobs (${jobs.length})` },
              { value: 'today', label: `Today (${stats.todayCount})` },
              { value: 'this-week', label: `This Week (${stats.weekCount})` },
              { value: 'scheduled', label: 'Scheduled Only' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500">Approved estimates will appear here for scheduling</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const schedule = getSchedule(job.id);
              const crewNames = schedule?.crewIds
                .map((id) => getCrewMember(id)?.name)
                .filter(Boolean)
                .join(', ');

              return (
                <Card
                  key={job.id}
                  padding="none"
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {job.customer.name}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(job.status)}`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {job.customer.address}, {job.customer.city}
                        </p>

                        {schedule && (
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1 text-purple-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(new Date(schedule.scheduledDate))} at {schedule.scheduledTime}
                            </span>
                            {crewNames && (
                              <span className="text-gray-500 truncate max-w-[150px]">
                                {crewNames}
                              </span>
                            )}
                          </div>
                        )}

                        {!schedule && job.status === 'approved' && (
                          <div className="mt-2">
                            <span className="text-sm text-amber-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Needs scheduling
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(getEstimateTotal(job))}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {job.estimateNumber}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-400">
                        Created {formatDate(job.createdAt)}
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {job.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(job.id, 'scheduled')}
                            className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                          >
                            Schedule
                          </button>
                        )}
                        {job.status === 'scheduled' && (
                          <button
                            onClick={() => handleStatusChange(job.id, 'completed')}
                            className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                          >
                            Mark Complete
                          </button>
                        )}
                        {job.status === 'completed' && (
                          <button
                            onClick={() => handleStatusChange(job.id, 'invoiced')}
                            className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                          >
                            Create Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
