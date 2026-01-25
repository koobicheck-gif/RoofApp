import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react';
import type {
  AllShinglePricing,
  AdditionalRepairType,
  PitchMultiplier,
  AccessibilityMultiplier,
  FixedFees,
  WarrantyOption,
  CompanyInfo,
} from '../types';
import {
  DEFAULT_SHINGLE_PRICING,
  DEFAULT_ADDITIONAL_REPAIRS,
  DEFAULT_PITCH_MULTIPLIERS,
  DEFAULT_ACCESSIBILITY_MULTIPLIERS,
  DEFAULT_FIXED_FEES,
  DEFAULT_WARRANTY_OPTIONS,
  DEFAULT_COMPANY_INFO,
} from '../data/defaultPricing';

// State interface
interface PricingState {
  shinglePricing: AllShinglePricing;
  additionalRepairs: AdditionalRepairType[];
  pitchMultipliers: PitchMultiplier[];
  accessibilityMultipliers: AccessibilityMultiplier[];
  fixedFees: FixedFees;
  warrantyOptions: WarrantyOption[];
  companyInfo: CompanyInfo;
}

// Actions
type PricingAction =
  | { type: 'SET_SHINGLE_PRICING'; payload: AllShinglePricing }
  | { type: 'SET_ADDITIONAL_REPAIRS'; payload: AdditionalRepairType[] }
  | { type: 'SET_PITCH_MULTIPLIERS'; payload: PitchMultiplier[] }
  | { type: 'SET_ACCESSIBILITY_MULTIPLIERS'; payload: AccessibilityMultiplier[] }
  | { type: 'SET_FIXED_FEES'; payload: FixedFees }
  | { type: 'SET_WARRANTY_OPTIONS'; payload: WarrantyOption[] }
  | { type: 'SET_COMPANY_INFO'; payload: CompanyInfo }
  | { type: 'RESET_TO_DEFAULTS' }
  | { type: 'LOAD_FROM_STORAGE'; payload: PricingState };

// Initial state
const initialState: PricingState = {
  shinglePricing: DEFAULT_SHINGLE_PRICING,
  additionalRepairs: DEFAULT_ADDITIONAL_REPAIRS,
  pitchMultipliers: DEFAULT_PITCH_MULTIPLIERS,
  accessibilityMultipliers: DEFAULT_ACCESSIBILITY_MULTIPLIERS,
  fixedFees: DEFAULT_FIXED_FEES,
  warrantyOptions: DEFAULT_WARRANTY_OPTIONS,
  companyInfo: DEFAULT_COMPANY_INFO,
};

// Reducer
function pricingReducer(state: PricingState, action: PricingAction): PricingState {
  switch (action.type) {
    case 'SET_SHINGLE_PRICING':
      return { ...state, shinglePricing: action.payload };
    case 'SET_ADDITIONAL_REPAIRS':
      return { ...state, additionalRepairs: action.payload };
    case 'SET_PITCH_MULTIPLIERS':
      return { ...state, pitchMultipliers: action.payload };
    case 'SET_ACCESSIBILITY_MULTIPLIERS':
      return { ...state, accessibilityMultipliers: action.payload };
    case 'SET_FIXED_FEES':
      return { ...state, fixedFees: action.payload };
    case 'SET_WARRANTY_OPTIONS':
      return { ...state, warrantyOptions: action.payload };
    case 'SET_COMPANY_INFO':
      return { ...state, companyInfo: action.payload };
    case 'RESET_TO_DEFAULTS':
      return initialState;
    case 'LOAD_FROM_STORAGE':
      return action.payload;
    default:
      return state;
  }
}

// Context
interface PricingContextValue {
  state: PricingState;
  dispatch: Dispatch<PricingAction>;
}

const PricingContext = createContext<PricingContextValue | null>(null);

// Storage key
const STORAGE_KEY = 'roofRepairPartners_pricing';

// Provider component
export function PricingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pricingReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsed });
      }
    } catch (error) {
      console.error('Failed to load pricing from storage:', error);
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save pricing to storage:', error);
    }
  }, [state]);

  return (
    <PricingContext.Provider value={{ state, dispatch }}>
      {children}
    </PricingContext.Provider>
  );
}

// Hook to use pricing context
export function usePricing() {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricing must be used within a PricingProvider');
  }
  return context;
}

// Selector hooks for convenience
export function useShinglePricing() {
  const { state } = usePricing();
  return state.shinglePricing;
}

export function useAdditionalRepairs() {
  const { state } = usePricing();
  return state.additionalRepairs.filter((r) => r.active);
}

export function usePitchMultipliers() {
  const { state } = usePricing();
  return state.pitchMultipliers;
}

export function useAccessibilityMultipliers() {
  const { state } = usePricing();
  return state.accessibilityMultipliers;
}

export function useFixedFees() {
  const { state } = usePricing();
  return state.fixedFees;
}

export function useWarrantyOptions() {
  const { state } = usePricing();
  return state.warrantyOptions;
}

export function useCompanyInfo() {
  const { state } = usePricing();
  return state.companyInfo;
}
