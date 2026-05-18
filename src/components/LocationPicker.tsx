import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Target, X, Check, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
  onClose?: () => void;
}

export default function LocationPicker({ 
  onLocationSelect, 
  initialLocation, 
  onClose 
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Default center (New Delhi)
  const defaultCenter = { lat: 28.6139, lng: 77.2090 };

  // Initialize MapTiler map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const loadMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamically import MapTiler SDK
        const maptiler = await import('@maptiler/sdk');
        const { Map } = maptiler;
        const { Marker } = maptiler;

        // Configure MapTiler SDK
        maptiler.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';

        // Create map
        const map = new Map({
          container: mapContainerRef.current!,
          style: maptiler.MapStyle.STREETS,
          center: selectedLocation ? [selectedLocation.lng, selectedLocation.lat] : [defaultCenter.lng, defaultCenter.lat],
          zoom: 12,
        });

        mapRef.current = map;

        // Add click event to place marker
        map.on('click', (e: any) => {
          const { lng, lat } = e.lngLat;
          setSelectedLocation({ lat, lng });
          
          // Remove existing marker
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Add new marker
          const marker = new Marker({ color: '#6366f1' })
            .setLngLat([lng, lat])
            .addTo(map);

          markerRef.current = marker;

          // Pan to marker
          map.panTo([lng, lat]);
        });

        // Add initial marker if location exists
        if (selectedLocation) {
          const marker = new Marker({ color: '#6366f1' })
            .setLngLat([selectedLocation.lng, selectedLocation.lat])
            .addTo(map);
          markerRef.current = marker;
        }

        setMapLoaded(true);
      } catch (err: any) {
        console.error('MapTiler error:', err);
        setError('Failed to load map. Please check your API key and internet connection.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (!mapRef.current || !selectedLocation || !markerRef.current) return;

    markerRef.current.setLngLat([selectedLocation.lng, selectedLocation.lat]);
    mapRef.current.panTo([selectedLocation.lng, selectedLocation.lat]);
  }, [selectedLocation]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        setSelectedLocation(location);
        setIsLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(
          err.code === 1
            ? 'Location permission denied. Please allow location access in your browser settings.'
            : 'Unable to retrieve your location. Please try again.'
        );
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Pick Your Location</h2>
              <p className="text-slate-500 text-sm">Click on the map or use your current location</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-rose-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="h-96 w-full bg-slate-100"
          >
            {isLoading && !mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Loading map...</p>
                </div>
              </div>
            )}
          </div>

          {/* Map Instructions */}
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-white/50">
              <p className="text-sm font-medium text-slate-700">
                Click anywhere on the map to place your location marker
              </p>
            </div>
          </div>

          {/* Current Location Button */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <Target className="w-5 h-5 text-indigo-600" />
            )}
          </button>
        </div>

        {/* Selected Coordinates Display */}
        <div className="p-6 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Latitude</div>
              <div className="font-mono font-bold text-lg">
                {selectedLocation ? selectedLocation.lat.toFixed(6) : '--'}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Longitude</div>
              <div className="font-mono font-bold text-lg">
                {selectedLocation ? selectedLocation.lng.toFixed(6) : '--'}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLoading}
              className={cn(
                "flex-1 bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Navigation className="w-5 h-5" />
              Use My Current Location
            </button>
            <button
              onClick={handleConfirmLocation}
              disabled={!selectedLocation}
              className={cn(
                "flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2",
                !selectedLocation && "opacity-50 cursor-not-allowed"
              )}
            >
              <Check className="w-5 h-5" />
              Confirm Location
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}