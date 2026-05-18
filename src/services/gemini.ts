import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { NAGPUR_METRO_STATIONS, findStationByName } from "../data/nagpurMetroStations";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to get metro station info for AI
const getMetroStationInfo = (stationName: string): string => {
  const station = findStationByName(stationName);
  if (!station) return '';
  
  return `Station: ${station.name} (${station.code})\nLine: ${station.line}\nCoordinates: ${station.latitude}, ${station.longitude}\nInterchange: ${station.interchange ? 'Yes' : 'No'}\nNearby: ${station.nearbyLandmarks?.join(', ') || 'None'}`;
};

const NAGPUR_METRO_DATA = `NAGPUR METRO STATIONS:
${NAGPUR_METRO_STATIONS.map(s => `  - ${s.name} (${s.code}) on ${s.line} Line${s.interchange ? ' (Interchange)' : ''}`).join('\n')}

KEY STATIONS:
- Sitabuldi (STB): Central hub, Aqua Line
- Lokmanya Nagar (LNR/LKN): Interchange between Aqua and Orange Lines
- Ajni Square (AJN): Near Ajni Railway Station, Aqua Line
- Khapri (KHP): Aqua Line terminus (South)
- Automotive Square (AUT): Orange Line terminus (East)`;

export const connectLive = (callbacks: {
  onopen: () => void;
  onmessage: (message: LiveServerMessage) => void;
  onerror: (error: any) => void;
  onclose: () => void;
}, userLocation?: { lat: number; lng: number }) => {
  const systemInstruction = `You are RailGuide Voice Assistant, an advanced AI voice agent for Indian Railways.

CAPABILITIES:
1. Train Information: Live status, schedules, routes
2. Seat Availability: Check seats for any train, date, class
3. PNR Status: Check booking confirmation
4. Journey Planning: Find trains between stations
5. Location Services: Find nearby stations, map integration
6. General Assistance: Railway policies, fares, rules
7. NAGPUR METRO: Complete metro network knowledge

METRO KNOWLEDGE:
${NAGPUR_METRO_DATA}

API ACCESS:
- Railradar API: Real-time train data
- MapTiler API: Maps and geocoding
- User Location: ${userLocation ? `Lat: ${userLocation.lat}, Lng: ${userLocation.lng}` : 'Not available'}

RESPONSE GUIDELINES:
1. Be conversational and natural in voice responses
2. Provide accurate, real-time information when available
3. Acknowledge when using live data vs general knowledge
4. For complex queries, offer step-by-step assistance
5. Always verify train numbers and station codes
6. Include practical tips (boarding time, platform info)
7. For journey planning, provide multi-modal routes:
   - Auto/Uber to railway station
   - Train details (number, departure, arrival)
   - Metro from railway station to destination
   - Final leg to actual destination

VOICE SETTINGS:
- Voice: Natural, friendly, professional
- Pace: Moderate, clear pronunciation
- Language: English with Indian railway terminology`;

  return ai.live.connect({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
      },
      outputAudioTranscription: {},
      inputAudioTranscription: {},
      systemInstruction,
    },
  });
};

export const getGeneralResponse = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a helpful Indian Railways assistant. You help users with train information, booking guidance, and general queries about Indian trains. Be concise and professional.",
    },
  });
  return response.text;
};

export const getJourneyPlan = async (prompt: string, location?: { lat: number; lng: number }) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: location ? {
          latLng: {
            latitude: location.lat,
            longitude: location.lng
          }
        } : undefined
      },
      systemInstruction: `You are a travel planning assistant for Indian Railways with complete knowledge of Nagpur Metro.

CRITICAL INSTRUCTIONS:
1. For journeys involving Nagpur:
   - First, identify if origin/destination are in Nagpur
   - If yes, provide multi-modal journey plan:
     a) Auto/Uber from current location to nearest railway station
     b) Train details (number, departure time, arrival time)
     c) Metro from railway station to destination metro station
     d) Final leg (auto/walk) to actual destination

2. Use Google Maps to find:
   - Nearest railway station to user's location
   - Nearest metro station to destination
   - Walking distances and times

3. For Nagpur Metro stations, use this data:
${NAGPUR_METRO_DATA}

4. Example format for Nagpur journey:
   "From Gondia to Lokmanya Nagar, Nagpur:
   1. Take auto/Uber from Gondia to Gondia Railway Station (approx 5 km)
   2. Board train [number] from Gondia to Nagpur Junction (NGP)
   3. At Nagpur Junction, walk to Nagpur Metro Station (NPR) - 200m
   4. Take Green Line metro towards Wadi
   5. Get off at Lokmanya Nagar station
   6. Walk to final destination (approx 300m)"

5. Always include:
   - Estimated travel times
   - Walking distances
   - Metro line colors
   - Interchange stations if needed
   - Last-mile connectivity options

6. For non-Nagpur journeys, provide standard train-based planning.

Be specific, practical, and include all necessary details for seamless travel.`,
    },
  });

  return {
    text: response.text,
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};
