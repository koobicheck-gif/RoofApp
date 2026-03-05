// GoHighLevel CRM API Service

const GHL_BASE_URL = 'https://rest.gohighlevel.com/v1';

function getHeaders() {
  const apiKey = import.meta.env.VITE_GHL_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GHL_API_KEY is not configured');
  }
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

function getLocationId(): string {
  const locationId = import.meta.env.VITE_GHL_LOCATION_ID;
  if (!locationId) {
    throw new Error('VITE_GHL_LOCATION_ID is not configured');
  }
  return locationId;
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
  locationId: string;
  tags?: string[];
}

export interface GHLOpportunity {
  pipelineId: string;
  pipelineStageId: string;
  locationId: string;
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
  const response = await fetch(`${GHL_BASE_URL}/pipelines/`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch pipelines: ${response.status}`);
  }

  const data: GHLPipelinesResponse = await response.json();
  return data.pipelines || [];
}

export async function findContactByEmail(email: string): Promise<string | null> {
  const locationId = getLocationId();
  const response = await fetch(
    `${GHL_BASE_URL}/contacts/?locationId=${locationId}&query=${encodeURIComponent(email)}`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to search contacts: ${response.status}`);
  }

  const data: GHLContactResponse = await response.json();
  const matchingContact = data.contacts?.find(
    c => c.email?.toLowerCase() === email.toLowerCase()
  );
  return matchingContact?.id || null;
}

export async function createContact(contact: Omit<GHLContact, 'id'>): Promise<string> {
  const response = await fetch(`${GHL_BASE_URL}/contacts/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(contact),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create contact: ${response.status} - ${errorText}`);
  }

  const data: GHLContactResponse = await response.json();
  if (!data.contact?.id) {
    throw new Error('No contact ID returned from GHL');
  }
  return data.contact.id;
}

export async function updateContact(contactId: string, contact: Partial<GHLContact>): Promise<void> {
  const response = await fetch(`${GHL_BASE_URL}/contacts/${contactId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(contact),
  });

  if (!response.ok) {
    throw new Error(`Failed to update contact: ${response.status}`);
  }
}

export async function createOpportunity(opportunity: GHLOpportunity): Promise<string> {
  const response = await fetch(`${GHL_BASE_URL}/pipelines/${opportunity.pipelineId}/opportunities`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(opportunity),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create opportunity: ${response.status} - ${errorText}`);
  }

  const data: GHLOpportunityResponse = await response.json();
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

// Check if GHL is configured
export function isGHLConfigured(): boolean {
  return !!(import.meta.env.VITE_GHL_API_KEY && import.meta.env.VITE_GHL_LOCATION_ID);
}
