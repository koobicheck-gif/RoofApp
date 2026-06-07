// Reverse geocoding utility using OpenStreetMap Nominatim API

export interface ReverseGeocodeResult {
  formattedAddress: string;
  houseNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'RoofApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (!data.address) {
      return null;
    }

    const address = data.address;
    const houseNumber = address.house_number;
    const street = address.road;
    const city = address.city || address.town || address.village || address.county;
    const state = address.state;
    const zip = address.postcode;

    // If no street address, return null (likely new construction)
    if (!street) {
      return null;
    }

    // Format the address
    const parts: string[] = [];

    if (houseNumber && street) {
      parts.push(`${houseNumber} ${street}`);
    } else if (street) {
      parts.push(street);
    }

    if (city) {
      parts.push(city);
    }

    if (state && zip) {
      parts.push(`${state} ${zip}`);
    } else if (state) {
      parts.push(state);
    }

    const formattedAddress = parts.join(', ');

    return {
      formattedAddress,
      houseNumber,
      street,
      city,
      state,
      zip,
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}
