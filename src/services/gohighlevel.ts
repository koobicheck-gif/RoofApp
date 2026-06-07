// GoHighLevel CRM API Service
// All API calls are proxied through Netlify Functions to keep API key secure

const PROXY_URL = '/.netlify/functions/ghl-proxy';

async function callProxy<T>(action: string, data?: unknown): Promise<T> {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `GHL API error: ${response.status}`);
  }

  return response.json();
}

// Types
export interface GHLContact {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  locationId?: string; // Added server-side by proxy
  tags?: string[];
}

export interface GHLOpportunity {
  pipelineId: string;
  pipelineStageId: string;
  locationId?: string; // Added server-side by proxy
  contactId: string;
  name: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  monetaryValue?: number;
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: { id: string; name: string }[];
}

export interface GHLContactResponse {
  contact?: {
    id: string;
  };
  contacts?: Array<{
    id: string;
    email: string;
  }>;
}

export interface GHLPipelinesResponse {
  pipelines: GHLPipeline[];
}

export interface GHLOpportunityResponse {
  id: string;
  name: string;
}

// API Functions

export async function getPipelines(): Promise<GHLPipeline[]> {
  const data = await callProxy<GHLPipelinesResponse>('getPipelines');
  return data.pipelines || [];
}

export async function findContactByEmail(email: string): Promise<string | null> {
  try {
    const data = await callProxy<GHLContactResponse>('findContact', { email });
    const matchingContact = data.contacts?.find(
      c => c.email?.toLowerCase() === email.toLowerCase()
    );
    return matchingContact?.id || null;
  } catch {
    return null;
  }
}

export async function createContact(contact: Omit<GHLContact, 'id'>): Promise<string> {
  const data = await callProxy<GHLContactResponse>('createContact', contact);
  if (!data.contact?.id) {
    throw new Error('No contact ID returned from GHL');
  }
  return data.contact.id;
}

export async function updateContact(contactId: string, contact: Partial<GHLContact>): Promise<void> {
  await callProxy('updateContact', { contactId, contact });
}

export async function createOpportunity(opportunity: GHLOpportunity): Promise<string> {
  const data = await callProxy<GHLOpportunityResponse>('createOpportunity', opportunity);
  return data.id;
}

// Helper to find Sales pipeline and first stage
let cachedPipelineInfo: { pipelineId: string; stageId: string } | null = null;

export async function getSalesPipelineInfo(): Promise<{ pipelineId: string; stageId: string }> {
  if (cachedPipelineInfo) {
    return cachedPipelineInfo;
  }

  const pipelines = await getPipelines();

  // Look for "Sales" pipeline, fall back to first pipeline
  const salesPipeline = pipelines.find(p =>
    p.name.toLowerCase().includes('sales')
  ) || pipelines[0];

  if (!salesPipeline) {
    throw new Error('No pipelines found in GHL');
  }

  if (!salesPipeline.stages || salesPipeline.stages.length === 0) {
    throw new Error('Sales pipeline has no stages');
  }

  cachedPipelineInfo = {
    pipelineId: salesPipeline.id,
    stageId: salesPipeline.stages[0].id,
  };

  return cachedPipelineInfo;
}

// Check if GHL is configured (server-side env vars, so we assume configured in production)
export function isGHLConfigured(): boolean {
  return import.meta.env.PROD || import.meta.env.VITE_GHL_ENABLED === 'true';
}
