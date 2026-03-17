import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const connectLive = (callbacks: {
  onopen: () => void;
  onmessage: (message: LiveServerMessage) => void;
  onerror: (error: any) => void;
  onclose: () => void;
}) => {
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
      systemInstruction: "You are a helpful Indian Railways assistant. You help users with train information, booking guidance, and general queries about Indian trains. You are speaking to the user in real-time.",
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
      systemInstruction: "You are a travel planning assistant. Use Google Maps to find the best way to reach a destination from a starting point, specifically focusing on train journeys but also including last-mile connectivity like buses or taxis. Provide a detailed step-by-step plan.",
    },
  });

  return {
    text: response.text,
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};
