export interface Train {
  number: string;
  name: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  runningDays: string[];
}

export interface LiveStatus {
  trainNumber: string;
  currentStation: string;
  status: string;
  delay: string;
  lastUpdated: string;
  nextStation: string;
}

export interface SeatAvailability {
  trainNumber: string;
  class: string;
  availability: string;
  fare: number;
}

export type TabType = 'spot' | 'pnr' | 'seats' | 'ai' | 'location';

export interface Message {
  role: 'user' | 'model';
  text: string;
  type?: 'general' | 'planning' | 'voice';
  groundingChunks?: any[];
  toolCall?: {
    name: string;
    parameters: any;
    result?: any;
  };
  metroRoute?: {
    fromStation: string;
    toStation: string;
    line: string;
    stops: number;
    distance: string;
  };
}
