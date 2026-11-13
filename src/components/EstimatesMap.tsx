import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from './ui';
import { useAllEstimates } from '../context/EstimateContext';
import { usePricing } from '../context/PricingContext';
import { calculateEstimate, formatCurrency } from '../utils/calculateEstimate';
import { rateLimitedFetch } from '../utils/rateLimiter';
import type { Estimate } from '../types';

// Real past jobs shown on map when no active estimates exist in the system yet
const MOCK_GEOCODED: GeocodedEstimate[] = [
  // 311 Hardy Dr — Preventative Chimney Seal $150 (Nov 3 2026)
  { id: 'm1', estimateNumber: 'RRP-1103-01', createdAt: new Date('2026-11-03'), updatedAt: new Date('2026-11-03'), status: 'sent', lat: 35.502, lng: -97.498, customer: { name: '', address: '311 Hardy Dr', city: 'Oklahoma City', state: 'OK', zip: '', phone: '405-342-4520', email: '' }, roofType: 'residential', shingleType: 'architectural_30', shingleDamage: [], additionalRepairs: [], customRepairs: [{ id: '1', name: 'Preventative Chimney Seal', material: 150, labor: 0, quantity: 1, unit: 'each' }], pitchMultiplierId: '', accessibilityMultiplierId: '', isEmergency: false, isAfterHours: false, warrantyOptionId: '', includeServiceAgreement: false, photos: [], scopeOfWork: 'Seal chimney & flashing. Prevent water intrusion. Extend roof life.', techNotes: '' },
  // 620 NW 28th St, OKC — Ventilation Repairs $750 (Nov 2 2026)
  { id: 'm2', estimateNumber: 'RRP-1102-02', createdAt: new Date('2026-11-02'), updatedAt: new Date('2026-11-02'), status: 'sent', lat: 35.492, lng: -97.527, customer: { name: '', address: '620 NW 28th St', city: 'Oklahoma City', state: 'OK', zip: '73106', phone: '405-888-9274', email: '' }, roofType: 'residential', shingleType: 'architectural_30', shingleDamage: [], additionalRepairs: [], customRepairs: [{ id: '1', name: 'Ventilation Repairs & Maintenance', material: 750, labor: 0, quantity: 1, unit: 'each' }], pitchMultiplierId: '', accessibilityMultiplierId: '', isEmergency: false, isAfterHours: false, warrantyOptionId: '', includeServiceAgreement: false, photos: [], scopeOfWork: 'Replace two wind turbines. Seal exposed nail heads. Weatherproof & cleanup.', techNotes: '' },
  // 11742 Hollyrock Dr, OKC 73162 — Active Leak Repairs $1,195 (Oct 14 2026)
  { id: 'm3', estimateNumber: 'RRP-261014-01', createdAt: new Date('2026-10-14'), updatedAt: new Date('2026-10-14'), status: 'approved', lat: 35.572, lng: -97.681, customer: { name: 'Signature Property Group', address: '11742 Hollyrock Dr', city: 'Oklahoma City', state: 'OK', zip: '73162', phone: '405-888-9274', email: '' }, roofType: 'residential', shingleType: 'architectural_30', shingleDamage: [], additionalRepairs: [], customRepairs: [{ id: '1', name: 'Active Leak Repairs & Maintenance', material: 1195, labor: 0, quantity: 1, unit: 'each' }], pitchMultiplierId: '', accessibilityMultiplierId: '', isEmergency: false, isAfterHours: false, warrantyOptionId: '', includeServiceAgreement: false, photos: [], scopeOfWork: 'Leak detection. Replace two pipe boots. Replace exhaust vent. Seal lifted shingles. Repair nail pops. Reseal ridge. Seal exposed nail heads. Final cleanup.', techNotes: '' },
  // 5201 N Post Rd, OKC 73112 — Chimney Flashing $450 (Oct 27 2026) — Terri Sparks
  { id: 'm4', estimateNumber: 'RRP-261027-TS', createdAt: new Date('2026-10-27'), updatedAt: new Date('2026-10-27'), status: 'sent', lat: 35.513, lng: -97.432, customer: { name: 'Terri Sparks', address: '5201 N Post Rd', city: 'Oklahoma City', state: 'OK', zip: '73112', phone: '', email: '' }, roofType: 'residential', shingleType: 'architectural_30', shingleDamage: [], additionalRepairs: [], customRepairs: [{ id: '1', name: 'Chimney Flashing & Sealing', material: 450, labor: 0, quantity: 1, unit: 'each' }], pitchMultiplierId: '', accessibilityMultiplierId: '', isEmergency: false, isAfterHours: false, warrantyOptionId: '', includeServiceAgreement: false, photos: [], scopeOfWork: 'Reseal chimney flashing. Seal openings in chimney. Final inspection.', techNotes: '' },
  // 8725 Rolling Green Ave, OKC 73162 — Roof Repairs $2,400 (Oct 27 2026)
  { id: 'm5', estimateNumber: 'RRP-261027-02', createdAt: new Date('2026-10-27'), updatedAt: new Date('2026-10-27'), status: 'approved', lat: 35.556, lng: -97.651, customer: { name: 'Property Owner', address: '8725 Rolling Green Ave', city: 'Oklahoma City', state: 'OK', zip: '73162', phone: '405-342-4520', email: '' }, roofType: 'residential', shingleType: 'architectural_30', shingleDamage: [], additionalRepairs: [], customRepairs: [{ id: '1', name: 'Roof Repairs', material: 2400, labor: 0, quantity: 1, unit: 'each' }], pitchMultiplierId: '', accessibilityMultiplierId: '', isEmergency: false, isAfterHours: false, warrantyOptionId: '', includeServiceAgreement: false, photos: [], scopeOfWork: 'Leak detection. Replace shingles (4 bundles). Decking repairs. Turbine vent installation. Pipe boot replacement. Seal chimney & flashing. Seal exposed nails.', techNotes: '' },
  // 2709 NW 42nd St, OKC 73112 — Targeted Roof Repair $1,450 (Oct 27 2026)
  { id: 'm6', estimateNumber: 'RRP-261027-01', createdAt: new Date('2026-10-27'), updatedAt: new Date('2026-10-27'), status: 'sent', lat: 35.519, lng: -97.520, customer: { name: 'Property Owner', address: '2709 NW 42nd St', city: 'Oklahoma City', state: 'OK', zip: '73112', phone: '405-888-9274', email: '' }, roofType: 'residential', shingleType: 'architectural_30', shingleDamage: [], additionalRepairs: [], customRepairs: [{ id: '1', name: 'Targeted Roof Repair', material: 1450, labor: 0, quantity: 1, unit: 'each' }], pitchMultiplierId: '', accessibilityMultiplierId: '', isEmergency: false, isAfterHours: false, warrantyOptionId: '', includeServiceAgreement: false, photos: [], scopeOfWork: 'Leak detection. Shingle replacement (2-3 bundles). Decking assessment. Exposed fasteners. Roof penetrations. Final cleanup.', techNotes: '' },
  // 1121 NW 15th St, OKC 73106 — Roof Leak Repairs & Tree Trimming $1,350 (Oct 27 2026)
  { id: 'm7', estimateNumber: 'RRP-261027-15th', createdAt: new Date('2026-10-27'), updatedAt: new Date('2026-10-27'), status: 'sent', lat: 35.470, lng: -97.531, customer: { name: 'Property Owner', address: '1121 NW 15th St', city: 'Oklahoma City', state: 'OK', zip: '73106', phone: '405-342-4520', email: '' }, roofType: 'residential', shingleType: 'architectural_30', shingleDamage: [], additionalRepairs: [], customRepairs: [{ id: '1', name: 'Roof Leak Repairs & Tree Trimming', material: 1350, labor: 0, quantity: 1, unit: 'each' }], pitchMultiplierId: '', accessibilityMultiplierId: '', isEmergency: false, isAfterHours: false, warrantyOptionId: '', includeServiceAgreement: false, photos: [], scopeOfWork: 'Leak detection. Replace damaged shingles (2 bundles). Repair step flashing. Repair modified roofing. Seal/replace exposed nails. Trim overhanging trees. Final cleanup.', techNotes: '' },
  // 3541 Bello Way, Edmond 73034 — Targeted Roof Repairs $750 (Oct 26 2026)
  { id: 'm8', estimateNumber: 'RRP-261026-01', createdAt: new Date('2026-10-26'), updatedAt: new Date('2026-10-26'), status: 'completed', lat: 35.671, lng: -97.479, customer: { name: 'Property Owner', address: '3541 Bello Way', city: 'Edmond', state: 'OK', zip: '73034', phone: '405-888-9274', email: '' }, roofType: 'residential', shingleType: 'architectural_30', shingleDamage: [], additionalRepairs: [], customRepairs: [{ id: '1', name: 'Targeted Roof Repairs', material: 750, labor: 0, quantity: 1, unit: 'each' }], pitchMultiplierId: '', accessibilityMultiplierId: '', isEmergency: false, isAfterHours: false, warrantyOptionId: '', includeServiceAgreement: false, photos: [], scopeOfWork: 'Leak detection. Install storm collar. Reseal chimney flashing. Seal/replace exposed nails. Final cleanup.', techNotes: '' },
  // 404 Hartford Dr, Edmond 73012 — Targeted Roof Repairs $2,450 (Oct 26 2026)
  { id: 'm9', estimateNumber: 'RRP-261026-Hartford', createdAt: new Date('2026-10-26'), updatedAt: new Date('2026-10-26'), status: 'approved', lat: 35.614, lng: -97.513, customer: { name: 'Property Owner', address: '404 Hartford Dr', city: 'Edmond', state: 'OK', zip: '73012', phone: '405-888-9274', email: '' }, roofType: 'residential', shingleType: 'architectural_30', shingleDamage: [], additionalRepairs: [], customRepairs: [{ id: '1', name: 'Targeted Roof Repairs', material: 2450, labor: 0, quantity: 1, unit: 'each' }], pitchMultiplierId: '', accessibilityMultiplierId: '', isEmergency: false, isAfterHours: false, warrantyOptionId: '', includeServiceAgreement: false, photos: [], scopeOfWork: 'Leak detection. Shingle repairs. Ridge cap repairs. Pipe boots. Exhaust vents. Chimney flashing. Exposed fasteners. Final cleanup.', techNotes: '' },
  // 2724 SW 60th St, OKC — Roof Repair & Maintenance $750
  { id: 'm10', estimateNumber: 'RRP-SW60', createdAt: new Date('2026-10-20'), updatedAt: new Date('2026-10-20'), status: 'completed', lat: 35.397, lng: -97.537, customer: { name: 'Property Owner', address: '2724 SW 60th St', city: 'Oklahoma City', state: 'OK', zip: '73119', phone: '', email: '' }, roofType: 'residential', shingleType: 'architectural_30', shingleDamage: [], additionalRepairs: [], customRepairs: [{ id: '1', name: 'Roof Repair & Maintenance', material: 750, labor: 0, quantity: 1, unit: 'each' }], pitchMultiplierId: '', accessibilityMultiplierId: '', isEmergency: false, isAfterHours: false, warrantyOptionId: '', includeServiceAgreement: false, photos: [], scopeOfWork: 'Install 25 LF drip edge. Install starter strip. Replace 14-16 GAF Weatherwood shingles. Hand-seal disturbed shingles. Cleanup and disposal.', techNotes: '' },
  // 2225 S Brookline Ave, Edmond 73013 — Recommended Roof Repairs $1,150
  { id: 'm11', estimateNumber: 'RRP-Brookline', createdAt: new Date('2026-10-15'), updatedAt: new Date('2026-10-15'), status: 'invoiced', lat: 35.558, lng: -97.608, customer: { name: 'Signature Property Group', address: '2225 S Brookline Ave', city: 'Edmond', state: 'OK', zip: '73013', phone: '', email: '' }, roofType: 'residential', shingleType: 'architectural_30', shingleDamage: [], additionalRepairs: [], customRepairs: [{ id: '1', name: 'Recommended Roof Repairs', material: 1150, labor: 0, quantity: 1, unit: 'each' }], pitchMultiplierId: '', accessibilityMultiplierId: '', isEmergency: false, isAfterHours: false, warrantyOptionId: '', includeServiceAgreement: false, photos: [], scopeOfWork: 'Replace approx one square of shingles. Repair & secure nail pops. Seal exposed nail heads. Replace misc shingles. Replace damaged ridge cap. Paint all roof metals. Complete cleanup. Final inspection.', techNotes: '' },
];

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface GeocodedEstimate extends Estimate {
  lat: number;
  lng: number;
}

interface EstimatesMapProps {
  onSelectEstimate?: (id: string) => void;
}

// Persistent geocoding cache (localStorage + memory)
const GEOCODE_CACHE_KEY = 'roofapp_geocode_cache';
const geocodeCache: Record<string, { lat: number; lng: number } | null> = (() => {
  try {
    const cached = localStorage.getItem(GEOCODE_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
})();

function saveGeocodeCache() {
  try {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(geocodeCache));
  } catch {
    // Ignore storage errors
  }
}

// Geocode address using free Nominatim API with rate limiting and persistent cache
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache[address] !== undefined) {
    return geocodeCache[address];
  }

  try {
    const encoded = encodeURIComponent(address);
    const response = await rateLimitedFetch(
      'nominatim',
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      {
        headers: {
          'User-Agent': 'RoofRepairPartners/1.0',
        },
      }
    );

    if (!response.ok) {
      geocodeCache[address] = null;
      saveGeocodeCache();
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      geocodeCache[address] = result;
      saveGeocodeCache();
      return result;
    }

    geocodeCache[address] = null;
    saveGeocodeCache();
    return null;
  } catch (error) {
    console.error('Geocoding failed:', error);
    geocodeCache[address] = null;
    return null;
  }
}

// Status to color mapping
function getStatusColor(status: Estimate['status']): string {
  switch (status) {
    case 'draft':
      return '#9ca3af'; // gray
    case 'sent':
      return '#3b82f6'; // blue
    case 'approved':
      return '#22c55e'; // green
    case 'scheduled':
      return '#a855f7'; // purple
    case 'completed':
      return '#10b981'; // emerald
    case 'invoiced':
      return '#f59e0b'; // amber
    case 'void':
      return '#ef4444'; // red
    default:
      return '#9ca3af';
  }
}

// Create custom marker icon
function createMarkerIcon(status: Estimate['status']): L.DivIcon {
  const color = getStatusColor(status);
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

export function EstimatesMap({ onSelectEstimate }: EstimatesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const estimates = useAllEstimates();
  const { state: pricingState } = usePricing();
  const [geocodedEstimates, setGeocodedEstimates] = useState<GeocodedEstimate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  // Calculate totals for estimates
  const getEstimateTotal = (estimate: Estimate): number => {
    // For mock estimates, sum customRepairs directly to avoid pricing config dependency
    if (estimate.id.startsWith('m') && estimate.customRepairs.length > 0) {
      return estimate.customRepairs.reduce((s, r) => s + (r.material + r.labor) * r.quantity, 0);
    }
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

  // Filter estimates with addresses
  const estimatesWithAddresses = useMemo(() => {
    return estimates.filter(
      (e) => e.customer.address && e.customer.city && e.customer.state
    );
  }, [estimates]);

  // Geocode all addresses
  useEffect(() => {
    async function geocodeAll() {
      setIsLoading(true);
      const results: GeocodedEstimate[] = [];

      for (const estimate of estimatesWithAddresses) {
        const fullAddress = `${estimate.customer.address}, ${estimate.customer.city}, ${estimate.customer.state} ${estimate.customer.zip}`;
        const coords = await geocodeAddress(fullAddress);

        if (coords) {
          results.push({
            ...estimate,
            lat: coords.lat,
            lng: coords.lng,
          });
        }
      }

      setGeocodedEstimates(results);
      setIsLoading(false);
    }

    if (estimatesWithAddresses.length > 0) {
      setUsingMockData(false);
      geocodeAll();
    } else {
      setUsingMockData(true);
      setGeocodedEstimates(MOCK_GEOCODED);
      setIsLoading(false);
    }
  }, [estimatesWithAddresses]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !showMap) return;

    // Create map centered on Oklahoma
    const map = L.map(mapRef.current, {
      center: [35.4676, -97.5164], // Oklahoma City
      zoom: 10,
      zoomControl: true,
    });

    // Add satellite tile layer (Esri World Imagery)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 19,
    }).addTo(map);

    // Add labels overlay
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [showMap]);

  // Add markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || geocodedEstimates.length === 0) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const bounds: L.LatLngBounds = L.latLngBounds([]);

    geocodedEstimates.forEach((estimate) => {
      const marker = L.marker([estimate.lat, estimate.lng], {
        icon: createMarkerIcon(estimate.status),
      });

      const total = getEstimateTotal(estimate);
      const displayName = estimate.customer.name || estimate.customer.address;
      const jobTitle = estimate.customRepairs[0]?.name || '';
      const popupContent = `
        <div style="min-width: 200px;">
          <strong style="font-size: 13px; color: #00224a;">${displayName}</strong>
          ${jobTitle ? `<div style="color: #555; font-size: 12px; font-weight: 600; margin-top: 2px;">${jobTitle}</div>` : ''}
          <div style="color: #888; font-size: 11px; margin-top: 3px;">
            ${estimate.customer.address}, ${estimate.customer.city}, ${estimate.customer.state}
          </div>
          <div style="color: #aaa; font-size: 10px;">${estimate.estimateNumber}</div>
          <div style="margin-top: 7px; display: flex; justify-content: space-between; align-items: center;">
            <span style="
              background-color: ${getStatusColor(estimate.status)}20;
              color: ${getStatusColor(estimate.status)};
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            ">${estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}</span>
            <strong style="color: #00224a; font-size: 15px;">${formatCurrency(total)}</strong>
          </div>
          ${onSelectEstimate ? `
            <button
              onclick="window.selectEstimate('${estimate.id}')"
              style="
                width: 100%;
                margin-top: 8px;
                padding: 6px 12px;
                background-color: #00224a;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
              "
            >View Details</button>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(map);

      bounds.extend([estimate.lat, estimate.lng]);
    });

    // Fit map to bounds if we have estimates
    if (geocodedEstimates.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geocodedEstimates, onSelectEstimate]);

  // Expose select function for popup buttons
  useEffect(() => {
    if (onSelectEstimate) {
      (window as { selectEstimate?: (id: string) => void }).selectEstimate = onSelectEstimate;
    }
    return () => {
      delete (window as { selectEstimate?: (id: string) => void }).selectEstimate;
    };
  }, [onSelectEstimate]);

  // Stats
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    geocodedEstimates.forEach((e) => {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    });
    return byStatus;
  }, [geocodedEstimates]);

  if (!showMap) {
    return (
      <button
        onClick={() => setShowMap(true)}
        className="w-full py-3 text-sm text-[#00224a] bg-[#00224a]/5 rounded-xl hover:bg-[#00224a]/10 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Show Map
      </button>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#00224a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="font-medium text-gray-900">Estimate Locations</span>
          {geocodedEstimates.length > 0 && (
            <span className="text-xs text-gray-500">
              ({geocodedEstimates.length} mapped)
            </span>
          )}
          {usingMockData && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Recent Jobs
            </span>
          )}
        </div>
        <button
          onClick={() => setShowMap(false)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Status Legend */}
      {Object.keys(stats).length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
          {Object.entries(stats).map(([status, count]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getStatusColor(status as Estimate['status']) }}
              />
              <span className="text-gray-600 capitalize">
                {status} ({count})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-gray-500">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading locations...
            </div>
          </div>
        )}
        <div
          ref={mapRef}
          className="h-64 w-full"
          style={{ zIndex: 1 }}
        />
      </div>

      {geocodedEstimates.length === 0 && !isLoading && estimatesWithAddresses.length > 0 && (
        <div className="p-4 text-center text-sm text-gray-500">
          Unable to map estimate locations
        </div>
      )}
    </Card>
  );
}
