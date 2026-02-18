import { useState, useMemo } from 'react';
import { Card } from '../ui';
import { useAllEstimates } from '../../context/EstimateContext';
import { useJobs } from '../../context/JobsContext';
import { usePricing } from '../../context/PricingContext';
import { calculateEstimate, formatCurrency } from '../../utils/calculateEstimate';
import type { Estimate } from '../../types';

interface ScheduleCalendarProps {
  onSelectJob: (id: string) => void;
}

type ViewMode = 'month' | 'week';

export function ScheduleCalendar({ onSelectJob }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showCrewFilter, setShowCrewFilter] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);

  const estimates = useAllEstimates();
  const { getSchedule, getCrewMember, getActiveCrew } = useJobs();
  const { state: pricingState } = usePricing();
  const activeCrew = getActiveCrew();

  // Get scheduled jobs
  const scheduledJobs = useMemo(() => {
    let jobs = estimates.filter(
      (e) => ['scheduled', 'approved', 'completed'].includes(e.status) && getSchedule(e.id)
    );

    // Filter by crew if selected
    if (selectedCrewId) {
      jobs = jobs.filter((job) => {
        const schedule = getSchedule(job.id);
        return schedule?.crewIds.includes(selectedCrewId);
      });
    }

    return jobs;
  }, [estimates, getSchedule, selectedCrewId]);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Week view helpers
  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const getJobsForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return scheduledJobs.filter((job) => {
      const schedule = getSchedule(job.id);
      return schedule?.scheduledDate === dateStr;
    }).sort((a, b) => {
      const schedA = getSchedule(a.id);
      const schedB = getSchedule(b.id);
      return (schedA?.scheduledTime || '').localeCompare(schedB?.scheduledTime || '');
    });
  };

  const getJobsForDay = (day: number) => {
    const date = new Date(year, month, day);
    return getJobsForDate(date);
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

  const today = new Date();
  const isToday = (date: Date) =>
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate();

  const isTodayInMonth = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  // Check if crew member has day off
  const hasCrewDayOff = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return activeCrew.filter((c) => c.daysOff?.includes(dateStr));
  };

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Calculate stats
  const weekStats = useMemo(() => {
    let jobCount = 0;
    let revenue = 0;
    let hours = 0;

    scheduledJobs.forEach((job) => {
      const schedule = getSchedule(job.id);
      if (schedule) {
        const schedDate = new Date(schedule.scheduledDate + 'T12:00');
        if (viewMode === 'month') {
          if (schedDate.getFullYear() === year && schedDate.getMonth() === month) {
            jobCount++;
            revenue += getEstimateTotal(job);
            hours += schedule.estimatedDuration || 0;
          }
        } else {
          const weekDates = getWeekDates();
          const startOfWeek = weekDates[0];
          const endOfWeek = weekDates[6];
          if (schedDate >= startOfWeek && schedDate <= endOfWeek) {
            jobCount++;
            revenue += getEstimateTotal(job);
            hours += schedule.estimatedDuration || 0;
          }
        }
      }
    });

    return { jobCount, revenue, hours };
  }, [scheduledJobs, year, month, viewMode, currentDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'scheduled': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Render job card
  const renderJobCard = (job: Estimate, compact = false) => {
    const schedule = getSchedule(job.id);
    const crewMembers = schedule?.crewIds.map((id) => getCrewMember(id)).filter(Boolean) || [];

    if (compact) {
      return (
        <button
          key={job.id}
          onClick={() => onSelectJob(job.id)}
          className={`w-full text-left px-1.5 py-1 text-xs rounded truncate hover:opacity-80 border ${getStatusColor(job.status)}`}
        >
          {schedule?.scheduledTime?.replace(':00', '')} {job.customer.name.split(' ')[0]}
          {crewMembers.length > 0 && (
            <span className="ml-1 opacity-70">
              ({crewMembers.map((c) => c!.name.split(' ')[0]).join(', ')})
            </span>
          )}
        </button>
      );
    }

    return (
      <button
        key={job.id}
        onClick={() => onSelectJob(job.id)}
        className={`w-full text-left p-3 rounded-lg hover:shadow-md transition-all border ${getStatusColor(job.status)}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{schedule?.scheduledTime}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/50">
                {schedule?.estimatedDuration}h
              </span>
            </div>
            <div className="font-medium truncate">{job.customer.name}</div>
            <div className="text-xs opacity-70 truncate">{job.customer.address}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-bold">{formatCurrency(getEstimateTotal(job))}</div>
          </div>
        </div>
        {crewMembers.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {crewMembers.map((member) => (
              <span
                key={member!.id}
                className="text-xs px-2 py-0.5 bg-white/70 rounded-full"
              >
                {member!.name}
              </span>
            ))}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">{weekStats.jobCount}</div>
          <div className="text-xs text-gray-500">
            {viewMode === 'month' ? 'This Month' : 'This Week'}
          </div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(weekStats.revenue)}</div>
          <div className="text-xs text-gray-500">Revenue</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">{weekStats.hours}h</div>
          <div className="text-xs text-gray-500">Scheduled</div>
        </Card>
      </div>

      {/* View Toggle & Filters */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'month' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'week' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
            }`}
          >
            Week
          </button>
        </div>
        <button
          onClick={() => setShowCrewFilter(!showCrewFilter)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
            selectedCrewId ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {selectedCrewId ? getCrewMember(selectedCrewId)?.name.split(' ')[0] : 'Crew'}
        </button>
      </div>

      {/* Crew Filter Dropdown */}
      {showCrewFilter && (
        <Card className="p-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCrewId(null); setShowCrewFilter(false); }}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                !selectedCrewId ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Crew
            </button>
            {activeCrew.map((member) => (
              <button
                key={member.id}
                onClick={() => { setSelectedCrewId(member.id); setShowCrewFilter(false); }}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  selectedCrewId === member.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {member.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Calendar */}
      <Card padding="none">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={viewMode === 'month' ? previousMonth : previousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">
              {viewMode === 'month'
                ? `${monthNames[month]} ${year}`
                : `Week of ${getWeekDates()[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              }
            </h2>
            <button
              onClick={goToToday}
              className="text-sm text-purple-600 hover:underline"
            >
              Today
            </button>
          </div>
          <button
            onClick={viewMode === 'month' ? nextMonth : nextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {dayNames.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Month View */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const jobs = day ? getJobsForDay(day) : [];
              const date = day ? new Date(year, month, day) : null;
              const isPast = date && date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const crewOff = date ? hasCrewDayOff(date) : [];

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-1 border-b border-r border-gray-100 ${
                    !day ? 'bg-gray-50' : ''
                  } ${isPast ? 'opacity-60' : ''}`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between">
                        <div
                          className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                            isTodayInMonth(day)
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </div>
                        {crewOff.length > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded" title={`Off: ${crewOff.map((c) => c.name).join(', ')}`}>
                            {crewOff.length} off
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {jobs.slice(0, 3).map((job) => renderJobCard(job, true))}
                        {jobs.length > 3 && (
                          <div className="text-xs text-gray-400 px-1">
                            +{jobs.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {getWeekDates().map((date) => {
              const jobs = getJobsForDate(date);
              const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const crewOff = hasCrewDayOff(date);

              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[300px] p-2 ${isPast ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`text-center ${
                        isToday(date)
                          ? 'bg-purple-600 text-white px-2 py-1 rounded-lg'
                          : ''
                      }`}
                    >
                      <div className="text-xs text-gray-500">{dayNames[date.getDay()]}</div>
                      <div className="text-lg font-bold">{date.getDate()}</div>
                    </div>
                    {crewOff.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                        {crewOff.length} off
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {jobs.map((job) => renderJobCard(job, false))}
                  </div>
                  {jobs.length === 0 && !isPast && (
                    <div className="text-center text-gray-300 text-sm mt-8">
                      No jobs
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Today's Jobs (Month View Only) */}
      {viewMode === 'month' && (
        <Card>
          <h3 className="font-bold text-gray-900 mb-4">Today's Jobs</h3>
          {getJobsForDay(today.getDate()).length === 0 &&
           today.getMonth() === month &&
           today.getFullYear() === year ? (
            <p className="text-gray-500 text-center py-4">No jobs scheduled for today</p>
          ) : today.getMonth() !== month || today.getFullYear() !== year ? (
            <p className="text-gray-500 text-center py-4">Navigate to current month to see today's jobs</p>
          ) : (
            <div className="space-y-2">
              {getJobsForDay(today.getDate()).map((job) => renderJobCard(job, false))}
            </div>
          )}
        </Card>
      )}

      {/* Crew Availability Legend */}
      <Card>
        <h3 className="font-bold text-gray-900 mb-3">Crew Availability</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {activeCrew.map((member) => {
            // Count upcoming days off this week/month
            const upcomingDaysOff = (member.daysOff || []).filter((d) => {
              const offDate = new Date(d + 'T12:00');
              return offDate >= today;
            }).length;

            return (
              <div
                key={member.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
                <div className={`w-2 h-2 rounded-full ${upcomingDaysOff > 0 ? 'bg-amber-400' : 'bg-green-400'}`} />
                <span className="text-sm text-gray-700 truncate">{member.name}</span>
                {upcomingDaysOff > 0 && (
                  <span className="text-xs text-amber-600 ml-auto">{upcomingDaysOff} off</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
