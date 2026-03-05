import { useState, useCallback } from 'react';
import type { Estimate, EstimateCalculation } from '../types';
import {
  isGHLConfigured,
  findContactByEmail,
  createContact,
  updateContact,
  createOpportunity,
  getSalesPipelineInfo,
} from '../services/gohighlevel';

export interface GHLSyncResult {
  success: boolean;
  contactId?: string;
  opportunityId?: string;
  error?: string;
}

export interface UseGHLReturn {
  syncEstimateToGHL: (estimate: Estimate, calculation: EstimateCalculation) => Promise<GHLSyncResult>;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
}

export function useGHL(): UseGHLReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncEstimateToGHL = useCallback(async (
    estimate: Estimate,
    calculation: EstimateCalculation
  ): Promise<GHLSyncResult> => {
    if (!isGHLConfigured()) {
      return { success: false, error: 'GHL not configured' };
    }

    if (!estimate.customer.email) {
      return { success: false, error: 'Customer email is required for GHL sync' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const locationId = import.meta.env.VITE_GHL_LOCATION_ID;

      // 1. Get pipeline info (cached after first call)
      const { pipelineId, stageId } = await getSalesPipelineInfo();

      // 2. Check for existing contact
      let contactId = await findContactByEmail(estimate.customer.email);

      // 3. Parse name into first/last
      const nameParts = estimate.customer.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // 4. Create or update contact
      const contactData = {
        firstName,
        lastName,
        email: estimate.customer.email,
        phone: estimate.customer.phone,
        address1: estimate.customer.address,
        city: estimate.customer.city,
        state: estimate.customer.state,
        postalCode: estimate.customer.zip,
        locationId,
        tags: ['RoofApp', 'Estimate Approved'],
      };

      if (contactId) {
        await updateContact(contactId, contactData);
      } else {
        contactId = await createContact(contactData);
      }

      // 5. Create opportunity
      const opportunityId = await createOpportunity({
        pipelineId,
        pipelineStageId: stageId,
        locationId,
        contactId,
        name: `Roof Repair - ${estimate.estimateNumber}`,
        status: 'open',
        monetaryValue: Math.round(calculation.grandTotal * 100) / 100,
      });

      setIsLoading(false);
      return {
        success: true,
        contactId,
        opportunityId,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'GHL sync failed';
      setError(errorMessage);
      setIsLoading(false);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  return {
    syncEstimateToGHL,
    isLoading,
    error,
    isConfigured: isGHLConfigured(),
  };
}
