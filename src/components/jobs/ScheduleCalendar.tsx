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

export function ScheduleCalendar({ onSelectJob }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const estimates = useAllEstimates();
  const { getSchedule, getCrewMember } = useJobs();
  const { state: pricingState } = usePricing();

  // Get scheduled jobs
  const scheduledJobs = useMemo(() => {
    return estimates.filter(
      (e) => ['scheduled', 'approved'].includes(e.status) && getSchedule(e.id)
    );
  }, [estimates, getSchedule]);

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

  const getJobsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduledJobs.filter((job) => {
      const schedule = getSchedule(job.id);
      return schedule?.scheduledDate === dateStr;
    });
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
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Calculate week totals
  const weekStats = useMemo(() => {
    let jobCount = 0;
    let revenue = 0;

    scheduledJobs.forEach((job) => {
      const schedule = getSchedule(job.id);
      if (schedule) {
        const schedDate = new Date(schedule.scheduledDate);
        if (schedDate.getFullYear() === year && schedDate.getMonth() === month) {
          jobCount++;
          revenue += getEstimateTotal(job);
        }
      }
    });

    return { jobCount, revenue };
  }, [scheduledJobs, year, month, getSchedule, getEstimateTotal]);

  return (
    <div className="space-y-4">
      {/* Month Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">{weekStats.jobCount}</div>
          <div className="text-sm text-gray-500">Jobs This Month</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(weekStats.revenue)}</div>
          <div className="text-sm text-gray-500">Scheduled Revenue</div>
        </Card>
      </div>

      {/* Calendar */}
      <Card padding="none">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={goToToday}
              className="text-sm text-purple-600 hover:underline"
            >
              Today
            </button>
          </div>
          <button
            onClick={nextMonth}
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

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const jobs = day ? getJobsForDay(day) : [];
            const isPast = day && new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div
                key={index}
                className={`min-h-[100px] p-1 border-b border-r border-gray-100 ${
                  !day ? 'bg-gray-50' : ''
                } ${isPast ? 'opacity-60' : ''}`}
              >
                {day && (
                  <>
                    <div
                      className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday(day)
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {jobs.slice(0, 3).map((job) => {
                        const schedule = getSchedule(job.id);
                        return (
                          <button
                            key={job.id}
                            onClick={() => onSelectJob(job.id)}
                            className="w-full text-left px-1.5 py-1 text-xs bg-purple-100 text-purple-700 rounded truncate hover:bg-purple-200"
                          >
                            {schedule?.scheduledTime?.replace(':00', '')} {job.customer.name.split(' ')[0]}
                          </button>
                        );
                      })}
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
      </Card>

      {/* Today's Jobs */}
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
            {getJobsForDay(today.getDate()).map((job) => {
              const schedule = getSchedule(job.id);
              const crewNames = schedule?.crewIds
                .map((id) => getCrewMember(id)?.name)
                .filter(Boolean)
                .join(', ');

              return (
                <button
                  key={job.id}
                  onClick={() => onSelectJob(job.id)}
                  className="w-full text-left p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{job.customer.name}</div>
                      <div className="text-sm text-gray-500">{job.customer.address}</div>
                      {crewNames && (
                        <div className="text-xs text-purple-600 mt-1">{crewNames}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">{schedule?.scheduledTime}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(getEstimateTotal(job))}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
