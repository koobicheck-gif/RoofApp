import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ReferralSource, Referral, ReferralPayout, ReferralStatus, PayoutStatus } from '../types';

// State interface
interface ReferralsState {
  sources: ReferralSource[];
  referrals: Referral[];
  payouts: ReferralPayout[];
}

// Actions
type ReferralsAction =
  // Load
  | { type: 'LOAD_STATE'; payload: ReferralsState }
  // Sources
  | { type: 'ADD_SOURCE'; payload: Omit<ReferralSource, 'id' | 'createdAt'> }
  | { type: 'UPDATE_SOURCE'; payload: ReferralSource }
  | { type: 'DELETE_SOURCE'; payload: string }
  | { type: 'TOGGLE_SOURCE_ACTIVE'; payload: string }
  // Referrals
  | { type: 'ADD_REFERRAL'; payload: Omit<Referral, 'id' | 'referralCode' | 'createdAt' | 'status'> & { sourceId: string } }
  | { type: 'UPDATE_REFERRAL'; payload: Referral }
  | { type: 'UPDATE_REFERRAL_STATUS'; payload: { id: string; status: ReferralStatus; estimateId?: string; jobTotal?: number } }
  | { type: 'LINK_ESTIMATE'; payload: { referralId: string; estimateId: string } }
  | { type: 'DELETE_REFERRAL'; payload: string }
  // Payouts
  | { type: 'CREATE_PAYOUT'; payload: { sourceId: string; referralIds: string[]; paymentMethod?: ReferralPayout['paymentMethod']; checkNumber?: string; notes?: string } }
  | { type: 'UPDATE_PAYOUT_STATUS'; payload: { id: string; status: PayoutStatus; by?: string } }
  | { type: 'DELETE_PAYOUT'; payload: string };

// Generate referral code
function generateReferralCode(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REF-${year}${month}${day}-${random}`;
}

// Initial state
const initialState: ReferralsState = {
  sources: [],
  referrals: [],
  payouts: [],
};

// Reducer
function referralsReducer(state: ReferralsState, action: ReferralsAction): ReferralsState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    // Source management
    case 'ADD_SOURCE': {
      const newSource: ReferralSource = {
        ...action.payload,
        id: uuidv4(),
        createdAt: new Date(),
        active: true,
      };
      return { ...state, sources: [...state.sources, newSource] };
    }

    case 'UPDATE_SOURCE':
      return {
        ...state,
        sources: state.sources.map(s => s.id === action.payload.id ? action.payload : s),
      };

    case 'DELETE_SOURCE':
      return { ...state, sources: state.sources.filter(s => s.id !== action.payload) };

    case 'TOGGLE_SOURCE_ACTIVE':
      return {
        ...state,
        sources: state.sources.map(s =>
          s.id === action.payload ? { ...s, active: !s.active } : s
        ),
      };

    // Referral management
    case 'ADD_REFERRAL': {
      const newReferral: Referral = {
        id: uuidv4(),
        referralCode: generateReferralCode(),
        sourceId: action.payload.sourceId,
        status: 'pending',
        referredCustomer: action.payload.referredCustomer,
        createdAt: new Date(),
        notes: action.payload.notes,
      };
      return { ...state, referrals: [...state.referrals, newReferral] };
    }

    case 'UPDATE_REFERRAL':
      return {
        ...state,
        referrals: state.referrals.map(r => r.id === action.payload.id ? action.payload : r),
      };

    case 'UPDATE_REFERRAL_STATUS': {
      const { id, status, estimateId, jobTotal } = action.payload;
      return {
        ...state,
        referrals: state.referrals.map(r => {
          if (r.id !== id) return r;
          const source = state.sources.find(s => s.id === r.sourceId);
          const commissionAmount = jobTotal && source
            ? (jobTotal * source.commissionRate / 100) + (source.fixedBonus || 0)
            : r.commissionAmount;
          return {
            ...r,
            status,
            estimateId: estimateId || r.estimateId,
            jobTotal: jobTotal || r.jobTotal,
            commissionAmount,
            estimateCreatedAt: status === 'estimate_created' && !r.estimateCreatedAt ? new Date() : r.estimateCreatedAt,
            convertedAt: status === 'converted' && !r.convertedAt ? new Date() : r.convertedAt,
            paidOutAt: status === 'paid_out' && !r.paidOutAt ? new Date() : r.paidOutAt,
          };
        }),
      };
    }

    case 'LINK_ESTIMATE':
      return {
        ...state,
        referrals: state.referrals.map(r =>
          r.id === action.payload.referralId
            ? { ...r, estimateId: action.payload.estimateId, status: 'estimate_created' as ReferralStatus, estimateCreatedAt: new Date() }
            : r
        ),
      };

    case 'DELETE_REFERRAL':
      return { ...state, referrals: state.referrals.filter(r => r.id !== action.payload) };

    // Payout management
    case 'CREATE_PAYOUT': {
      const { sourceId, referralIds, paymentMethod, checkNumber, notes } = action.payload;
      const referralsForPayout = state.referrals.filter(r => referralIds.includes(r.id));
      const totalAmount = referralsForPayout.reduce((sum, r) => sum + (r.commissionAmount || 0), 0);

      const newPayout: ReferralPayout = {
        id: uuidv4(),
        referralIds,
        sourceId,
        totalAmount,
        status: 'pending',
        paymentMethod,
        checkNumber,
        createdAt: new Date(),
        notes,
      };

      // Mark referrals as paid out
      const updatedReferrals = state.referrals.map(r =>
        referralIds.includes(r.id)
          ? { ...r, status: 'paid_out' as ReferralStatus, paidOutAt: new Date() }
          : r
      );

      return {
        ...state,
        payouts: [...state.payouts, newPayout],
        referrals: updatedReferrals,
      };
    }

    case 'UPDATE_PAYOUT_STATUS': {
      const { id, status, by } = action.payload;
      return {
        ...state,
        payouts: state.payouts.map(p => {
          if (p.id !== id) return p;
          return {
            ...p,
            status,
            approvedAt: status === 'approved' && !p.approvedAt ? new Date() : p.approvedAt,
            approvedBy: status === 'approved' ? by : p.approvedBy,
            paidAt: status === 'paid' && !p.paidAt ? new Date() : p.paidAt,
            paidBy: status === 'paid' ? by : p.paidBy,
          };
        }),
      };
    }

    case 'DELETE_PAYOUT':
      return { ...state, payouts: state.payouts.filter(p => p.id !== action.payload) };

    default:
      return state;
  }
}

// Context
interface ReferralsContextValue {
  state: ReferralsState;
  dispatch: Dispatch<ReferralsAction>;
  // Helper functions
  getSource: (id: string) => ReferralSource | undefined;
  getActiveSources: () => ReferralSource[];
  getReferralsBySource: (sourceId: string) => Referral[];
  getReferralByEstimate: (estimateId: string) => Referral | undefined;
  getPendingPayouts: () => ReferralPayout[];
  getConvertedUnpaidReferrals: () => Referral[];
}

const ReferralsContext = createContext<ReferralsContextValue | null>(null);

// Storage key
const STORAGE_KEY = 'roofRepairPartners_referrals';

// Provider component
export function ReferralsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(referralsReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const loadedState: ReferralsState = {
          sources: (parsed.sources || []).map((s: ReferralSource) => ({
            ...s,
            createdAt: new Date(s.createdAt),
          })),
          referrals: (parsed.referrals || []).map((r: Referral) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            estimateCreatedAt: r.estimateCreatedAt ? new Date(r.estimateCreatedAt) : undefined,
            convertedAt: r.convertedAt ? new Date(r.convertedAt) : undefined,
            paidOutAt: r.paidOutAt ? new Date(r.paidOutAt) : undefined,
          })),
          payouts: (parsed.payouts || []).map((p: ReferralPayout) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            approvedAt: p.approvedAt ? new Date(p.approvedAt) : undefined,
            paidAt: p.paidAt ? new Date(p.paidAt) : undefined,
          })),
        };
        dispatch({ type: 'LOAD_STATE', payload: loadedState });
      }
    } catch (error) {
      console.error('Failed to load referrals from storage:', error);
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save referrals to storage:', error);
    }
  }, [state]);

  // Helper functions
  const getSource = (id: string) => state.sources.find(s => s.id === id);
  const getActiveSources = () => state.sources.filter(s => s.active);
  const getReferralsBySource = (sourceId: string) => state.referrals.filter(r => r.sourceId === sourceId);
  const getReferralByEstimate = (estimateId: string) => state.referrals.find(r => r.estimateId === estimateId);
  const getPendingPayouts = () => state.payouts.filter(p => p.status !== 'paid');
  const getConvertedUnpaidReferrals = () => state.referrals.filter(r => r.status === 'converted' && r.commissionAmount && r.commissionAmount > 0);

  return (
    <ReferralsContext.Provider value={{
      state,
      dispatch,
      getSource,
      getActiveSources,
      getReferralsBySource,
      getReferralByEstimate,
      getPendingPayouts,
      getConvertedUnpaidReferrals,
    }}>
      {children}
    </ReferralsContext.Provider>
  );
}

// Hook to use referrals context
export function useReferrals() {
  const context = useContext(ReferralsContext);
  if (!context) {
    throw new Error('useReferrals must be used within a ReferralsProvider');
  }
  return context;
}

// Convenience hooks
export function useAllReferrals() {
  const { state } = useReferrals();
  return state.referrals;
}

export function useReferralSources() {
  const { state } = useReferrals();
  return state.sources;
}

export function useReferralPayouts() {
  const { state } = useReferrals();
  return state.payouts;
}
