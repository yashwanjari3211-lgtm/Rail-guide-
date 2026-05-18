import { connectLive } from './gemini';
import { fetchLiveTrainStatus, searchTrains, fetchSeatAvailability, fetchTrainsBetweenStations, fetchPnrStatus } from './railApi';

// Function to get location from MapTiler (reverse geocoding)
const getLocationFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('MapTiler geocoding error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

// Function to search nearby stations using MapTiler
const findNearbyStations = async (lat: number, lng: number, radiusKm: number = 10): Promise<any[]> => {
  try {
    // This is a simplified version - in production, you'd use a station database
    // For now, we'll return mock data with coordinates
    const mockStations = [
      { name: "New Delhi Railway Station", code: "NDLS", distance: "2.5 km", lat: 28.6415, lng: 77.2208 },
      { name: "Delhi Junction", code: "DLI", distance: "5.1 km", lat: 28.6609, lng: 77.2274 },
      { name: "Hazrat Nizamuddin", code: "NZM", distance: "8.3 km", lat: 28.5886, lng: 77.2510 }
    ];
    
    // Calculate distances (simplified)
    return mockStations.map(station => ({
      ...station,
      actualDistance: Math.sqrt(
        Math.pow(station.lat - lat, 2) + Math.pow(station.lng - lng, 2)
      ) * 111 // Approximate km per degree
    })).filter(station => station.actualDistance <= radiusKm)
      .sort((a, b) => a.actualDistance - b.actualDistance);
  } catch (error) {
    console.error('Station search error:', error);
    return [];
  }
};

// Enhanced voice session with API context
export const startEnhancedVoiceSession = async (
  callbacks: {
    onOpen: () => void;
    onMessage: (message: any) => void;
    onError: (error: any) => void;
    onClose: () => void;
  },
  userLocation?: { lat: number; lng: number }
) => {
  const systemInstruction = `You are RailGuide Voice Assistant, an advanced AI voice agent for Indian Railways.

CAPABILITIES:
1. Train Information: Live status, schedules, routes
2. Seat Availability: Check seats for any train, date, class
3. PNR Status: Check booking confirmation
4. Journey Planning: Find trains between stations
5. Location Services: Find nearby stations, map integration
6. General Assistance: Railway policies, fares, rules

API ACCESS:
- Railradar API: Real-time train data (key: ${import.meta.env.VITE_RAILRADAR_API_KEY ? 'Available' : 'Not available'})
- MapTiler API: Maps and geocoding (key: ${import.meta.env.VITE_MAPTILER_API_KEY ? 'Available' : 'Not available'})
- User Location: ${userLocation ? `Lat: ${userLocation.lat}, Lng: ${userLocation.lng}` : 'Not available'}

RESPONSE GUIDELINES:
1. Be conversational and natural in voice responses
2. Provide accurate, real-time information when available
3. Acknowledge when using live data vs general knowledge
4. For complex queries, offer step-by-step assistance
5. Always verify train numbers and station codes
6. Include practical tips (boarding time, platform info)

VOICE SETTINGS:
- Voice: Natural, friendly, professional
- Pace: Moderate, clear pronunciation
- Language: English with Indian railway terminology`;

  return connectLive({
    onopen: callbacks.onOpen,
    onmessage: callbacks.onMessage,
    onerror: callbacks.onError,
    onclose: callbacks.onClose
  });
};

// Tool implementations for future use
export const voiceAgentTools = {
  getLiveTrainStatus: async (trainNumber: string) => {
    try {
      const result = await fetchLiveTrainStatus(trainNumber);
      if (result.status && result.data) {
        return {
          success: true,
          data: {
            trainNumber: result.data.train_no,
            trainName: result.data.train_name,
            currentStation: result.data.current_station_name,
            delay: result.data.delay,
            status: result.data.delay === 0 ? 'On Time' : `${result.data.delay} minutes late`,
            nextStation: result.data.next_station_name,
            lastUpdated: result.data.last_updated,
            position: result.data.position
          }
        };
      }
      return { success: false, error: result.message || 'Failed to fetch train status' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  },

  searchTrains: async (query: string) => {
    try {
      const result = await searchTrains(query);
      if (result.status && result.data) {
        return {
          success: true,
          data: result.data.map((train: any) => ({
            number: train.train_number || train.train_no,
            name: train.train_name,
            from: train.src_stn_name || train.source_stn_name,
            to: train.dstn_stn_name || train.dest_stn_name,
            departureTime: train.from_time,
            arrivalTime: train.to_time,
            runningDays: train.run_days || ['Daily']
          }))
        };
      }
      return { success: false, error: result.message || 'No trains found' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  },

  checkSeatAvailability: async (trainNumber: string, fromStation: string, toStation: string, date: string, classCode: string = '3A') => {
    try {
      const result = await fetchSeatAvailability(trainNumber, fromStation, toStation, date, classCode);
      if (result.status && result.data) {
        return {
          success: true,
          data: result.data.map((seat: any) => ({
            availability: seat.availability,
            fare: seat.fare,
            date: seat.date,
            class: classCode
          }))
        };
      }
      return { success: false, error: result.message || 'No availability data' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  },

  findTrainsBetweenStations: async (fromStation: string, toStation: string, date: string) => {
    try {
      const result = await fetchTrainsBetweenStations(fromStation, toStation, date);
      if (result.status && result.data) {
        return {
          success: true,
          data: result.data.map((train: any) => ({
            number: train.train_number,
            name: train.train_name,
            class: train.train_type
          }))
        };
      }
      return { success: false, error: result.message || 'No trains found' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  },

  checkPnrStatus: async (pnrNumber: string) => {
    try {
      const result = await fetchPnrStatus(pnrNumber);
      if (result.status && result.data) {
        return {
          success: true,
          data: {
            pnr: result.data.pnr,
            trainNumber: result.data.train_no,
            trainName: result.data.train_name,
            journeyDate: result.data.doj,
            fromStation: result.data.source_stn,
            toStation: result.data.destination_stn,
            passengers: result.data.passenger?.map((p: any) => ({
              seat: p.current_coach_id ? `${p.current_coach_id}-${p.current_berth_no}` : 'Not allocated',
              status: p.current_status || p.booking_status
            })) || []
          }
        };
      }
      return { success: false, error: result.message || 'PNR not found' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  },

  getNearbyStations: async (latitude: number, longitude: number, radiusKm: number = 10) => {
    try {
      const stations = await findNearbyStations(latitude, longitude, radiusKm);
      return {
        success: true,
        data: stations.map(station => ({
          name: station.name,
          code: station.code,
          distance: station.distance,
          coordinates: { lat: station.lat, lng: station.lng }
        }))
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to find stations' };
    }
  },

  getLocationName: async (latitude: number, longitude: number) => {
    try {
      const locationName = await getLocationFromCoordinates(latitude, longitude);
      return {
        success: true,
        data: { locationName, coordinates: { latitude, longitude } }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get location name' };
    }
  }
};