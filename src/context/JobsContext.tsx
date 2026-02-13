import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { CrewMember, JobSchedule, JobTimelineEvent, JobCompletion } from '../types';

interface JobsState {
  crew: CrewMember[];
  schedules: Record<string, JobSchedule>; // keyed by estimate id
  timelines: Record<string, JobTimelineEvent[]>; // keyed by estimate id
  completions: Record<string, JobCompletion>; // keyed by estimate id
}

type JobsAction =
  | { type: 'SET_CREW'; payload: CrewMember[] }
  | { type: 'ADD_CREW_MEMBER'; payload: CrewMember }
  | { type: 'UPDATE_CREW_MEMBER'; payload: CrewMember }
  | { type: 'DELETE_CREW_MEMBER'; payload: string }
  | { type: 'SET_SCHEDULE'; payload: { estimateId: string; schedule: JobSchedule } }
  | { type: 'REMOVE_SCHEDULE'; payload: string }
  | { type: 'ADD_TIMELINE_EVENT'; payload: { estimateId: string; event: JobTimelineEvent } }
  | { type: 'SET_COMPLETION'; payload: { estimateId: string; completion: JobCompletion } }
  | { type: 'LOAD_STATE'; payload: JobsState };

const STORAGE_KEY = 'roofapp_jobs';

const DEFAULT_CREW: CrewMember[] = [
  { id: 'crew-1', name: 'Mike Johnson', phone: '(405) 555-0101', role: 'lead', active: true },
  { id: 'crew-2', name: 'Carlos Rodriguez', phone: '(405) 555-0102', role: 'technician', active: true },
  { id: 'crew-3', name: 'James Wilson', phone: '(405) 555-0103', role: 'technician', active: true },
  { id: 'crew-4', name: 'David Lee', phone: '(405) 555-0104', role: 'helper', active: true },
];

const initialState: JobsState = {
  crew: DEFAULT_CREW,
  schedules: {},
  timelines: {},
  completions: {},
};

function loadFromStorage(): JobsState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...initialState,
        ...parsed,
        crew: parsed.crew || DEFAULT_CREW,
      };
    }
  } catch (e) {
    console.error('Failed to load jobs state:', e);
  }
  return initialState;
}

function saveToStorage(state: JobsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save jobs state:', e);
  }
}

function jobsReducer(state: JobsState, action: JobsAction): JobsState {
  switch (action.type) {
    case 'SET_CREW':
      return { ...state, crew: action.payload };

    case 'ADD_CREW_MEMBER':
      return { ...state, crew: [...state.crew, action.payload] };

    case 'UPDATE_CREW_MEMBER':
      return {
        ...state,
        crew: state.crew.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case 'DELETE_CREW_MEMBER':
      return {
        ...state,
        crew: state.crew.filter((c) => c.id !== action.payload),
      };

    case 'SET_SCHEDULE':
      return {
        ...state,
        schedules: {
          ...state.schedules,
          [action.payload.estimateId]: action.payload.schedule,
        },
      };

    case 'REMOVE_SCHEDULE': {
      const { [action.payload]: _, ...rest } = state.schedules;
      return { ...state, schedules: rest };
    }

    case 'ADD_TIMELINE_EVENT': {
      const existingEvents = state.timelines[action.payload.estimateId] || [];
      return {
        ...state,
        timelines: {
          ...state.timelines,
          [action.payload.estimateId]: [...existingEvents, action.payload.event],
        },
      };
    }

    case 'SET_COMPLETION':
      return {
        ...state,
        completions: {
          ...state.completions,
          [action.payload.estimateId]: action.payload.completion,
        },
      };

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

interface JobsContextType {
  state: JobsState;
  dispatch: React.Dispatch<JobsAction>;
  getSchedule: (estimateId: string) => JobSchedule | undefined;
  getTimeline: (estimateId: string) => JobTimelineEvent[];
  getCompletion: (estimateId: string) => JobCompletion | undefined;
  getCrewMember: (id: string) => CrewMember | undefined;
  getActiveCrew: () => CrewMember[];
}

const JobsContext = createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(jobsReducer, initialState, loadFromStorage);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const getSchedule = (estimateId: string) => state.schedules[estimateId];
  const getTimeline = (estimateId: string) => state.timelines[estimateId] || [];
  const getCompletion = (estimateId: string) => state.completions[estimateId];
  const getCrewMember = (id: string) => state.crew.find((c) => c.id === id);
  const getActiveCrew = () => state.crew.filter((c) => c.active);

  return (
    <JobsContext.Provider
      value={{
        state,
        dispatch,
        getSchedule,
        getTimeline,
        getCompletion,
        getCrewMember,
        getActiveCrew,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
}
