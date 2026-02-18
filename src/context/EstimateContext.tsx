import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Estimate, Customer, ShingleType, ShingleDamage, AdditionalRepair, CustomRepair, EstimatePhoto, RoofType, FlatRoofDetails } from '../types';

// State interface
interface EstimateState {
  estimates: Estimate[];
  currentEstimate: Estimate | null;
}

// Actions
type EstimateAction =
  | { type: 'LOAD_ESTIMATES'; payload: Estimate[] }
  | { type: 'CREATE_NEW_ESTIMATE' }
  | { type: 'LOAD_ESTIMATE'; payload: string }
  | { type: 'SET_CURRENT_ESTIMATE'; payload: Estimate }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'SET_ROOF_TYPE'; payload: RoofType }
  | { type: 'SET_SHINGLE_TYPE'; payload: ShingleType }
  | { type: 'SET_FLAT_ROOF_DETAILS'; payload: FlatRoofDetails }
  | { type: 'SET_SHINGLE_DAMAGE'; payload: ShingleDamage[] }
  | { type: 'SET_ADDITIONAL_REPAIRS'; payload: AdditionalRepair[] }
  | { type: 'SET_CUSTOM_REPAIRS'; payload: CustomRepair[] }
  | { type: 'SET_PITCH_MULTIPLIER'; payload: string }
  | { type: 'SET_ACCESSIBILITY_MULTIPLIER'; payload: string }
  | { type: 'SET_EMERGENCY'; payload: boolean }
  | { type: 'SET_AFTER_HOURS'; payload: boolean }
  | { type: 'SET_WARRANTY'; payload: string }
  | { type: 'SET_SERVICE_AGREEMENT'; payload: { include: boolean; planId?: string } }
  | { type: 'SET_SCOPE_OF_WORK'; payload: string }
  | { type: 'SET_TECH_NOTES'; payload: string }
  | { type: 'ADD_PHOTO'; payload: EstimatePhoto }
  | { type: 'REMOVE_PHOTO'; payload: string }
  | { type: 'SAVE_ESTIMATE' }
  | { type: 'UPDATE_ESTIMATE_STATUS'; payload: { id: string; status: Estimate['status'] } }
  | { type: 'DELETE_ESTIMATE'; payload: string }
  | { type: 'DUPLICATE_ESTIMATE'; payload: string }
  | { type: 'CLEAR_CURRENT_ESTIMATE' };

// Generate estimate number
function generateEstimateNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RRP-${year}${month}${day}-${random}`;
}

// Create empty estimate
function createEmptyEstimate(): Estimate {
  return {
    id: uuidv4(),
    estimateNumber: generateEstimateNumber(),
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft',
    customer: {
      name: '',
      address: '',
      city: '',
      state: 'OK',
      zip: '',
      phone: '',
      email: '',
    },
    roofType: 'residential',
    shingleType: 'architectural',
    flatRoofDetails: undefined,
    shingleDamage: [
      { layerDepth: 'surface', count: 0 },
      { layerDepth: 'one-layer', count: 0 },
      { layerDepth: 'two-layer', count: 0 },
      { layerDepth: 'three-layer', count: 0 },
    ],
    additionalRepairs: [],
    customRepairs: [],
    pitchMultiplierId: 'low',
    accessibilityMultiplierId: 'easy',
    isEmergency: false,
    isAfterHours: false,
    warrantyOptionId: 'standard',
    includeServiceAgreement: false,
    selectedServicePlanId: undefined,
    scopeOfWork: '',
    photos: [],
    techNotes: '',
  };
}

// Initial state
const initialState: EstimateState = {
  estimates: [],
  currentEstimate: null,
};

// Reducer
function estimateReducer(state: EstimateState, action: EstimateAction): EstimateState {
  switch (action.type) {
    case 'LOAD_ESTIMATES':
      return { ...state, estimates: action.payload };

    case 'CREATE_NEW_ESTIMATE':
      return { ...state, currentEstimate: createEmptyEstimate() };

    case 'LOAD_ESTIMATE': {
      const estimate = state.estimates.find((e) => e.id === action.payload);
      return { ...state, currentEstimate: estimate || null };
    }

    case 'SET_CURRENT_ESTIMATE':
      return { ...state, currentEstimate: action.payload };

    case 'UPDATE_CUSTOMER':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          customer: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_ROOF_TYPE':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          roofType: action.payload,
          // Reset flat roof details when switching to residential
          flatRoofDetails: action.payload === 'residential' ? undefined : state.currentEstimate.flatRoofDetails,
          updatedAt: new Date(),
        },
      };

    case 'SET_SHINGLE_TYPE':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          shingleType: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_FLAT_ROOF_DETAILS':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          flatRoofDetails: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_SHINGLE_DAMAGE':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          shingleDamage: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_ADDITIONAL_REPAIRS':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          additionalRepairs: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_CUSTOM_REPAIRS':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          customRepairs: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_PITCH_MULTIPLIER':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          pitchMultiplierId: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_ACCESSIBILITY_MULTIPLIER':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          accessibilityMultiplierId: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_EMERGENCY':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          isEmergency: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_AFTER_HOURS':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          isAfterHours: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_WARRANTY':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          warrantyOptionId: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_SERVICE_AGREEMENT':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          includeServiceAgreement: action.payload.include,
          selectedServicePlanId: action.payload.planId,
          updatedAt: new Date(),
        },
      };

    case 'SET_SCOPE_OF_WORK':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          scopeOfWork: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'SET_TECH_NOTES':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          techNotes: action.payload,
          updatedAt: new Date(),
        },
      };

    case 'ADD_PHOTO':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          photos: [...state.currentEstimate.photos, action.payload],
          updatedAt: new Date(),
        },
      };

    case 'REMOVE_PHOTO':
      if (!state.currentEstimate) return state;
      return {
        ...state,
        currentEstimate: {
          ...state.currentEstimate,
          photos: state.currentEstimate.photos.filter((p) => p.id !== action.payload),
          updatedAt: new Date(),
        },
      };

    case 'SAVE_ESTIMATE': {
      if (!state.currentEstimate) return state;
      const updatedEstimate = { ...state.currentEstimate, updatedAt: new Date() };
      const existingIndex = state.estimates.findIndex((e) => e.id === updatedEstimate.id);
      let newEstimates;
      if (existingIndex >= 0) {
        newEstimates = [...state.estimates];
        newEstimates[existingIndex] = updatedEstimate;
      } else {
        newEstimates = [...state.estimates, updatedEstimate];
      }
      return {
        ...state,
        estimates: newEstimates,
        currentEstimate: updatedEstimate,
      };
    }

    case 'UPDATE_ESTIMATE_STATUS': {
      const newEstimates = state.estimates.map((e) =>
        e.id === action.payload.id
          ? { ...e, status: action.payload.status, updatedAt: new Date() }
          : e
      );
      return { ...state, estimates: newEstimates };
    }

    case 'DELETE_ESTIMATE':
      return {
        ...state,
        estimates: state.estimates.filter((e) => e.id !== action.payload),
        currentEstimate:
          state.currentEstimate?.id === action.payload ? null : state.currentEstimate,
      };

    case 'DUPLICATE_ESTIMATE': {
      const original = state.estimates.find((e) => e.id === action.payload);
      if (!original) return state;
      const duplicate: Estimate = {
        ...original,
        id: uuidv4(),
        estimateNumber: generateEstimateNumber(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
      };
      return {
        ...state,
        estimates: [...state.estimates, duplicate],
        currentEstimate: duplicate,
      };
    }

    case 'CLEAR_CURRENT_ESTIMATE':
      return { ...state, currentEstimate: null };

    default:
      return state;
  }
}

// Context
interface EstimateContextValue {
  state: EstimateState;
  dispatch: Dispatch<EstimateAction>;
}

const EstimateContext = createContext<EstimateContextValue | null>(null);

// Storage key
const STORAGE_KEY = 'roofRepairPartners_estimates';

// Provider component
export function EstimateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(estimateReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const estimates = parsed.map((e: Estimate) => ({
          ...e,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt),
          photos: e.photos?.map((p: EstimatePhoto) => ({
            ...p,
            timestamp: new Date(p.timestamp),
          })) || [],
        }));
        dispatch({ type: 'LOAD_ESTIMATES', payload: estimates });
      }
    } catch (error) {
      console.error('Failed to load estimates from storage:', error);
    }
  }, []);

  // Save to localStorage on estimates change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.estimates));
    } catch (error) {
      console.error('Failed to save estimates to storage:', error);
    }
  }, [state.estimates]);

  return (
    <EstimateContext.Provider value={{ state, dispatch }}>
      {children}
    </EstimateContext.Provider>
  );
}

// Hook to use estimate context
export function useEstimate() {
  const context = useContext(EstimateContext);
  if (!context) {
    throw new Error('useEstimate must be used within an EstimateProvider');
  }
  return context;
}

// Convenience hooks
export function useCurrentEstimate() {
  const { state } = useEstimate();
  return state.currentEstimate;
}

export function useAllEstimates() {
  const { state } = useEstimate();
  return state.estimates;
}
