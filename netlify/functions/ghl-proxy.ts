// Netlify Function to proxy GoHighLevel API calls
// This keeps the API key on the server side, not exposed to the browser

import type { Handler, HandlerEvent } from '@netlify/functions';

const GHL_BASE_URL = 'https://rest.gohighlevel.com/v1';

const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Get API key from environment (server-side only)
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GHL not configured' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { action, data } = body;

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    let response: Response;
    let result: unknown;

    switch (action) {
      case 'getPipelines':
        response = await fetch(`${GHL_BASE_URL}/pipelines/`, { headers });
        result = await response.json();
        break;

      case 'findContact':
        response = await fetch(
          `${GHL_BASE_URL}/contacts/?locationId=${locationId}&query=${encodeURIComponent(data.email)}`,
          { headers }
        );
        result = await response.json();
        break;

      case 'createContact':
        response = await fetch(`${GHL_BASE_URL}/contacts/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...data, locationId }),
        });
        result = await response.json();
        break;

      case 'updateContact':
        response = await fetch(`${GHL_BASE_URL}/contacts/${data.contactId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data.contact),
        });
        result = await response.json();
        break;

      case 'createOpportunity':
        response = await fetch(
          `${GHL_BASE_URL}/pipelines/${data.pipelineId}/opportunities`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...data, locationId }),
          }
        );
        result = await response.json();
        break;

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'GHL API error', details: result }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('GHL Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
