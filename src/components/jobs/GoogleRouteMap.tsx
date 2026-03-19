import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '../ui';

export interface RouteJob {
  id: string;
  label: string;
  address: string;
  toggled: boolean;
}

interface GoogleRouteMapProps {
  jobs: RouteJob[];
  fallbackStartAddress?: string;
  height?: string;
}

interface RouteInfo {
  totalDistance: string;
  totalDuration: string;
  legs: {
    startAddress: string;
    endAddress: string;
    distance: string;
    duration: string;
  }[];
  optimizedOrder: number[];
}

interface LatLngLiteral {
  lat: number;
  lng: number;
}

// Google Maps API key from environment
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Default fallback location: Oklahoma City
const DEFAULT_FALLBACK_ADDRESS = '123 N Robinson Ave, Oklahoma City, OK 73102';

// Extend window for Google Maps
declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options: unknown) => unknown;
        Marker: new (options: unknown) => unknown;
        DirectionsService: new () => unknown;
        DirectionsRenderer: new (options: unknown) => unknown;
        Geocoder: new () => unknown;
        LatLngBounds: new () => unknown;
        TravelMode: { DRIVING: string };
        SymbolPath: { CIRCLE: number };
      };
    };
  }
}

// Load Google Maps script
let googleMapsLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  if (window.google?.maps) {
    return Promise.resolve();
  }

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));

    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

export function GoogleRouteMap({
  jobs,
  fallbackStartAddress = DEFAULT_FALLBACK_ADDRESS,
  height = '400px'
}: GoogleRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const directionsRendererRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [userLocation, setUserLocation] = useState<LatLngLiteral | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);

  // Get toggled jobs
  const toggledJobs = jobs.filter(job => job.toggled);

  // Initialize user location via geolocation
  useEffect(() => {
    setIsGettingLocation(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsGettingLocation(false);
        },
        () => {
          // Geolocation failed, will use fallback address
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    } else {
      setIsGettingLocation(false);
    }
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    let mounted = true;

    async function initMap() {
      try {
        await loadGoogleMapsScript();

        if (!mounted || !mapRef.current || !window.google) return;

        const { Map, DirectionsRenderer } = window.google.maps;

        // Initialize map centered on Oklahoma City with satellite view
        const map = new Map(mapRef.current, {
          center: { lat: 35.4676, lng: -97.5164 },
          zoom: 10,
          mapTypeId: 'hybrid', // Satellite with labels
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true, // Allow switching between map types
          streetViewControl: false,
          fullscreenControl: true
        });

        mapInstanceRef.current = map;

        // Initialize directions renderer
        const directionsRenderer = new DirectionsRenderer({
          suppressMarkers: true, // We'll add our own numbered markers
          polylineOptions: {
            strokeColor: '#00224a',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (directionsRenderer as any).setMap(map);
        directionsRendererRef.current = directionsRenderer;

        setIsLoading(false);
        setError(null);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load map');
          setIsLoading(false);
        }
      }
    }

    initMap();

    return () => {
      mounted = false;
    };
  }, []);

  // Clear markers helper
  const clearMarkers = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markersRef.current.forEach((marker: any) => marker.setMap(null));
    markersRef.current = [];
  }, []);

  // Create numbered marker
  const createNumberedMarker = useCallback((
    position: LatLngLiteral,
    number: number,
    title: string,
    isStart = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => {
    if (!window.google) return null;
    const { Marker, SymbolPath } = window.google.maps;

    const marker = new Marker({
      position,
      map: mapInstanceRef.current,
      label: {
        text: isStart ? 'S' : String(number),
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px'
      },
      title,
      icon: {
        path: SymbolPath.CIRCLE,
        fillColor: isStart ? '#16a34a' : '#00224a',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
        scale: 16
      }
    });
    return marker;
  }, []);

  // Update route when toggled jobs change
  useEffect(() => {
    if (isLoading || isGettingLocation || !mapInstanceRef.current || !window.google) return;

    const map = mapInstanceRef.current;
    const directionsRenderer = directionsRendererRef.current;
    const { DirectionsService, Geocoder, LatLngBounds, TravelMode } = window.google.maps;

    // Clear existing markers and route
    clearMarkers();
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
    }
    setRouteInfo(null);

    // Handle 0 jobs toggled - clear map
    if (toggledJobs.length === 0) {
      map.setCenter({ lat: 35.4676, lng: -97.5164 });
      map.setZoom(10);
      return;
    }

    // Handle 1 job toggled - show single pin
    if (toggledJobs.length === 1) {
      const geocoder = new Geocoder();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (geocoder as any).geocode({ address: toggledJobs[0].address }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const marker = createNumberedMarker(
            { lat: location.lat(), lng: location.lng() },
            1,
            toggledJobs[0].label
          );
          if (marker) markersRef.current.push(marker);

          map.setCenter(location);
          map.setZoom(14);
        }
      });
      return;
    }

    // Handle 2+ jobs - calculate optimized route
    const directionsService = new DirectionsService();

    // Determine origin
    let origin: string | LatLngLiteral;
    if (userLocation) {
      origin = userLocation;
    } else {
      origin = fallbackStartAddress;
    }

    // Build waypoints (all jobs except we'll use first as destination)
    const waypoints = toggledJobs.slice(0, -1).map(job => ({
      location: job.address,
      stopover: true
    }));

    // Last job is the destination
    const destination = toggledJobs[toggledJobs.length - 1].address;

    const request = {
      origin,
      destination,
      waypoints,
      optimizeWaypoints: true,
      travelMode: TravelMode.DRIVING
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (directionsService as any).route(request, (result: any, status: string) => {
      if (status === 'OK' && result && result.routes[0]) {
        const route = result.routes[0];

        // Display route
        if (directionsRenderer) {
          directionsRenderer.setDirections(result);
        }

        // Add numbered markers in optimized order
        const optimizedOrder = route.waypoint_order;
        const legs = route.legs;

        // Add start marker
        if (legs[0]) {
          const startMarker = createNumberedMarker(
            {
              lat: legs[0].start_location.lat(),
              lng: legs[0].start_location.lng()
            },
            0,
            userLocation ? 'Your Location' : fallbackStartAddress,
            true
          );
          if (startMarker) markersRef.current.push(startMarker);
        }

        // Add numbered markers for each stop
        let stopNumber = 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        legs.forEach((leg: any, index: number) => {
          const marker = createNumberedMarker(
            {
              lat: leg.end_location.lat(),
              lng: leg.end_location.lng()
            },
            stopNumber,
            index < optimizedOrder.length
              ? toggledJobs[optimizedOrder[index]].label
              : toggledJobs[toggledJobs.length - 1].label
          );
          if (marker) markersRef.current.push(marker);
          stopNumber++;
        });

        // Calculate route info
        let totalDistance = 0;
        let totalDuration = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const legInfos = legs.map((leg: any) => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
          return {
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            distance: leg.distance.text,
            duration: leg.duration.text
          };
        });

        setRouteInfo({
          totalDistance: `${(totalDistance / 1609.34).toFixed(1)} mi`,
          totalDuration: formatDuration(totalDuration),
          legs: legInfos,
          optimizedOrder
        });

        // Fit bounds to show entire route
        const bounds = new LatLngBounds();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        legs.forEach((leg: any) => {
          (bounds as any).extend(leg.start_location);
          (bounds as any).extend(leg.end_location);
        });
        map.fitBounds(bounds, 50);
      } else {
        setError(`Directions request failed: ${status}`);
      }
    });
  }, [toggledJobs, isLoading, isGettingLocation, userLocation, fallbackStartAddress, clearMarkers, createNumberedMarker]);

  // Format duration in hours and minutes
  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  }

  // Empty state
  if (toggledJobs.length === 0 && !isLoading) {
    return (
      <Card className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No Jobs Selected</p>
        <p className="text-sm text-gray-400 mt-1">Toggle jobs on to plan your route</p>
      </Card>
    );
  }

  // Error state
  if (error && !GOOGLE_MAPS_API_KEY) {
    return (
      <Card className="text-center py-8">
        <div className="text-amber-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-700 font-medium">Google Maps API Key Required</p>
        <p className="text-sm text-gray-500 mt-1">Add VITE_GOOGLE_MAPS_API_KEY to your environment</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <Card padding="none" className="overflow-hidden">
        <div
          ref={mapRef}
          style={{ height, width: '100%' }}
          className="bg-gray-100"
        >
          {isLoading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Route Info */}
      {routeInfo && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Optimized Route</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium">{routeInfo.totalDistance}</span>
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{routeInfo.totalDuration}</span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {routeInfo.legs.map((leg, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${index === 0 ? 'bg-green-600' : 'bg-[#00224a]'}`}>
                  {index === 0 ? 'S' : index}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {index === 0 ? 'Start' : `Stop ${index}`} → {index === routeInfo.legs.length - 1 ? 'Final Stop' : `Stop ${index + 1}`}
                  </p>
                  <p className="text-gray-500 truncate text-xs">{leg.endAddress}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium text-gray-700">{leg.distance}</p>
                  <p className="text-gray-400 text-xs">{leg.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Location Status */}
      {isGettingLocation && (
        <p className="text-xs text-gray-400 text-center">Getting your location...</p>
      )}
      {!isGettingLocation && !userLocation && toggledJobs.length > 1 && (
        <p className="text-xs text-gray-400 text-center">
          Using fallback start location. Enable location for accurate routing.
        </p>
      )}
    </div>
  );
}
