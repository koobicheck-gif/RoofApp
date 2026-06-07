import { useState, useEffect } from 'react';
import { rateLimitedFetch } from '../utils/rateLimiter';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  isDay: boolean;
  uvIndex: number;
  visibility: number;
  cloudCover: number;
}

interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
  windSpeed: number;
}

interface LocationData {
  lat: number;
  lng: number;
  city?: string;
}

// Weather code to description and icon mapping
const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Foggy', icon: '🌫️' },
  48: { description: 'Rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌦️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️' },
  66: { description: 'Freezing rain', icon: '🌨️' },
  67: { description: 'Heavy freezing rain', icon: '🌨️' },
  71: { description: 'Slight snow', icon: '🌨️' },
  73: { description: 'Moderate snow', icon: '❄️' },
  75: { description: 'Heavy snow', icon: '❄️' },
  77: { description: 'Snow grains', icon: '🌨️' },
  80: { description: 'Slight showers', icon: '🌦️' },
  81: { description: 'Moderate showers', icon: '🌧️' },
  82: { description: 'Violent showers', icon: '⛈️' },
  85: { description: 'Slight snow showers', icon: '🌨️' },
  86: { description: 'Heavy snow showers', icon: '❄️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️' },
  99: { description: 'Severe thunderstorm', icon: '⛈️' },
};

// Wind direction to compass
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

// Get roofing recommendation based on weather
function getRoofingCondition(weather: WeatherData): { status: string; color: string; message: string } {
  if (weather.precipitation > 0 || weather.precipitationProbability > 60) {
    return { status: 'Poor', color: 'text-red-500', message: 'Not recommended for roofing work' };
  }
  if (weather.windSpeed > 25) {
    return { status: 'Caution', color: 'text-amber-500', message: 'High winds - use caution' };
  }
  if (weather.temperature < 40) {
    return { status: 'Cold', color: 'text-blue-500', message: 'Cold conditions - shingles may be brittle' };
  }
  if (weather.temperature > 95) {
    return { status: 'Hot', color: 'text-orange-500', message: 'Extreme heat - take precautions' };
  }
  if (weather.precipitationProbability > 30) {
    return { status: 'Fair', color: 'text-yellow-500', message: 'Chance of rain - monitor conditions' };
  }
  return { status: 'Good', color: 'text-green-500', message: 'Ideal conditions for roofing' };
}

// Format hour for display
function formatHour(isoString: string): string {
  const date = new Date(isoString);
  const hour = date.getHours();
  if (hour === 0) return '12AM';
  if (hour === 12) return '12PM';
  return hour > 12 ? `${hour - 12}PM` : `${hour}AM`;
}

export function WeatherBanner() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRadar, setShowRadar] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      setIsLoading(true);
      setError(null);

      try {
        // Get user location
        let coords: LocationData;

        if ('geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 300000
              });
            });
            coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
          } catch {
            // Fallback to Oklahoma City
            coords = { lat: 35.4676, lng: -97.5164, city: 'Oklahoma City' };
          }
        } else {
          coords = { lat: 35.4676, lng: -97.5164, city: 'Oklahoma City' };
        }

        setLocation(coords);

        // Fetch weather from Open-Meteo API (including hourly data) with rate limiting
        const response = await rateLimitedFetch(
          'weather',
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,is_day,uv_index&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_hours=12`
        );

        if (!response.ok) throw new Error('Weather fetch failed');

        const data = await response.json();
        const current = data.current;
        const hourlyPrecipProb = data.hourly?.precipitation_probability?.[0] || 0;

        setWeather({
          temperature: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          precipitation: current.precipitation,
          precipitationProbability: hourlyPrecipProb,
          windSpeed: Math.round(current.wind_speed_10m),
          windDirection: current.wind_direction_10m,
          weatherCode: current.weather_code,
          isDay: current.is_day === 1,
          uvIndex: current.uv_index || 0,
          visibility: 10, // Open-Meteo doesn't provide this in free tier
          cloudCover: current.cloud_cover
        });

        // Parse hourly forecast (next 12 hours)
        if (data.hourly) {
          const hourly: HourlyForecast[] = [];
          const times = data.hourly.time || [];
          const temps = data.hourly.temperature_2m || [];
          const codes = data.hourly.weather_code || [];
          const precips = data.hourly.precipitation_probability || [];
          const winds = data.hourly.wind_speed_10m || [];

          for (let i = 0; i < Math.min(12, times.length); i++) {
            hourly.push({
              time: times[i],
              temperature: Math.round(temps[i]),
              weatherCode: codes[i],
              precipitationProbability: precips[i],
              windSpeed: Math.round(winds[i]),
            });
          }
          setHourlyForecast(hourly);
        }

        // Reverse geocode to get city name if not set (with rate limiting)
        if (!coords.city) {
          try {
            const geoResponse = await rateLimitedFetch(
              'nominatim',
              `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`
            );
            const geoData = await geoResponse.json();
            setLocation(prev => prev ? {
              ...prev,
              city: geoData.address?.city || geoData.address?.town || geoData.address?.county || 'Your Location'
            } : null);
          } catch {
            setLocation(prev => prev ? { ...prev, city: 'Your Location' } : null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch weather');
      } finally {
        setIsLoading(false);
      }
    }

    fetchWeather();
    // Refresh every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);


  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-[#00224a] to-[#003366] rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-center gap-2 text-white/70">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-sm">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-center gap-2 text-white/70">
          <span className="text-lg">⚠️</span>
          <span className="text-sm">Weather unavailable</span>
        </div>
      </div>
    );
  }

  const weatherInfo = WEATHER_CODES[weather.weatherCode] || { description: 'Unknown', icon: '🌡️' };
  const roofingCondition = getRoofingCondition(weather);
  const windDir = getWindDirection(weather.windDirection);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className={`bg-gradient-to-r ${weather.isDay ? 'from-[#00224a] via-[#003366] to-[#004488]' : 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]'} rounded-2xl p-4 shadow-lg transition-all hover:shadow-xl`}>
          {/* Main Weather Row */}
          <div className="flex items-center justify-between">
            {/* Left: Icon + Temp */}
            <div className="flex items-center gap-3">
              <span className="text-4xl">{weatherInfo.icon}</span>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{weather.temperature}°</span>
                  <span className="text-white/60 text-sm">F</span>
                </div>
                <p className="text-white/70 text-sm">{weatherInfo.description}</p>
              </div>
            </div>

            {/* Center: Location */}
            <div className="hidden sm:block text-center">
              <p className="text-white font-medium">{location?.city || 'Loading...'}</p>
              <p className="text-white/50 text-xs">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>

            {/* Right: Quick Stats */}
            <div className="flex items-center gap-4">
              {/* Rain */}
              <div className="text-center">
                <div className="flex items-center gap-1 text-white">
                  <span className="text-lg">💧</span>
                  <span className="font-semibold">{weather.precipitationProbability}%</span>
                </div>
                <p className="text-white/50 text-xs">Rain</p>
              </div>

              {/* Wind */}
              <div className="text-center hidden sm:block">
                <div className="flex items-center gap-1 text-white">
                  <span className="text-lg">💨</span>
                  <span className="font-semibold">{weather.windSpeed}</span>
                  <span className="text-xs text-white/60">mph</span>
                </div>
                <p className="text-white/50 text-xs">{windDir}</p>
              </div>

              {/* Roofing Status */}
              <div className={`px-3 py-1.5 rounded-full ${roofingCondition.color === 'text-green-500' ? 'bg-green-500/20' : roofingCondition.color === 'text-red-500' ? 'bg-red-500/20' : roofingCondition.color === 'text-amber-500' ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                <span className={`text-sm font-semibold ${roofingCondition.color}`}>
                  {roofingCondition.status}
                </span>
              </div>

              {/* Expand Arrow */}
              <svg
                className={`w-5 h-5 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-white/10">
              {/* Roofing Recommendation */}
              <div className={`mb-4 p-3 rounded-xl ${roofingCondition.color === 'text-green-500' ? 'bg-green-500/10' : roofingCondition.color === 'text-red-500' ? 'bg-red-500/10' : roofingCondition.color === 'text-amber-500' ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏠</span>
                  <div>
                    <p className={`font-semibold ${roofingCondition.color}`}>Roofing Conditions: {roofingCondition.status}</p>
                    <p className="text-white/70 text-sm">{roofingCondition.message}</p>
                  </div>
                </div>
              </div>

              {/* Hourly Forecast */}
              {hourlyForecast.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/70 text-sm mb-2">Hourly Forecast</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {hourlyForecast.map((hour, idx) => {
                      const hourWeather = WEATHER_CODES[hour.weatherCode] || { icon: '🌡️' };
                      return (
                        <div
                          key={idx}
                          className="flex-shrink-0 bg-white/5 rounded-xl p-2 text-center min-w-[70px]"
                        >
                          <p className="text-white/60 text-xs mb-1">{formatHour(hour.time)}</p>
                          <span className="text-xl">{hourWeather.icon}</span>
                          <p className="text-white font-semibold text-sm">{hour.temperature}°</p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-xs">💧</span>
                            <span className="text-white/60 text-xs">{hour.precipitationProbability}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* News 9 Live Radar */}
              <div className="mb-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRadar(!showRadar);
                  }}
                  className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-2 transition-colors"
                >
                  <span className="text-lg">📡</span>
                  <span>News 9 Live Radar</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showRadar ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showRadar && (
                  <div className="relative rounded-xl overflow-hidden bg-slate-900" style={{ height: '320px' }}>
                    <iframe
                      src="https://www.news9.com/nextgen-live-radar"
                      title="News 9 Live Radar"
                      className="absolute inset-0 w-full h-full border-0"
                      allow="geolocation"
                      loading="lazy"
                    />

                    {/* Fallback link overlay */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <a
                        href="https://www.news9.com/nextgen-live-radar"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <span>Open News 9 Radar</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <div className="bg-black/70 rounded-lg px-2 py-1">
                        <span className="text-white/70 text-[10px]">KWTV Oklahoma City</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/50 text-xs mb-1">Feels Like</p>
                  <p className="text-white font-semibold text-lg">{weather.feelsLike}°F</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/50 text-xs mb-1">Humidity</p>
                  <p className="text-white font-semibold text-lg">{weather.humidity}%</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/50 text-xs mb-1">UV Index</p>
                  <p className="text-white font-semibold text-lg">{weather.uvIndex}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/50 text-xs mb-1">Cloud Cover</p>
                  <p className="text-white font-semibold text-lg">{weather.cloudCover}%</p>
                </div>
              </div>

              {/* Precipitation Alert */}
              {weather.precipitation > 0 && (
                <div className="mt-3 p-3 bg-blue-500/20 rounded-xl flex items-center gap-2">
                  <span className="text-xl">🌧️</span>
                  <p className="text-blue-300 text-sm">
                    Current precipitation: {weather.precipitation.toFixed(2)} in
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
