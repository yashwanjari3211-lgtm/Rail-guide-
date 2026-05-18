// Nagpur Metro Rail Corporation - All Operational Stations
// Source: Nagpur Metro official data (Corrected)

export interface MetroStation {
  code: string;
  name: string;
  line: 'Aqua' | 'Orange';
  latitude: number;
  longitude: number;
  interchange?: boolean;
  nearbyLandmarks?: string[];
}

export const NAGPUR_METRO_STATIONS: MetroStation[] = [
  // Aqua Line (North-South Corridor) - Sitabuldi to Khapri
  {
    code: 'STB',
    name: 'Sitabuldi',
    line: 'Aqua',
    latitude: 21.1458,
    longitude: 79.0882,
    interchange: true,
    nearbyLandmarks: ['Sitabuldi Fort', 'Central Mall', 'Variety Square']
  },
  {
    code: 'RAM',
    name: 'Ram Jhula',
    line: 'Aqua',
    latitude: 21.1398,
    longitude: 79.0845,
    nearbyLandmarks: ['Ram Jhula Bridge']
  },
  {
    code: 'ZSQ',
    name: 'Zero Mile Freedom Park',
    line: 'Aqua',
    latitude: 21.1352,
    longitude: 79.0812,
    nearbyLandmarks: ['Zero Mile Stone', 'Freedom Park']
  },
  {
    code: 'VAN',
    name: 'Vanaz',
    line: 'Aqua',
    latitude: 21.1298,
    longitude: 79.0778,
    nearbyLandmarks: ['Vanaz Corner']
  },
  {
    code: 'LNR',
    name: 'Lokmanya Nagar',
    line: 'Aqua',
    latitude: 21.1245,
    longitude: 79.0745,
    nearbyLandmarks: ['Lokmanya Nagar Market', 'Residential Area']
  },
  {
    code: 'TAD',
    name: 'Telephone Exchange Square',
    line: 'Aqua',
    latitude: 21.1192,
    longitude: 79.0712,
    nearbyLandmarks: ['Telephone Exchange']
  },
  {
    code: 'AJN',
    name: 'Ajni Square',
    line: 'Aqua',
    latitude: 21.1138,
    longitude: 79.0678,
    nearbyLandmarks: ['Ajni Railway Station', 'Ajni Market']
  },
  {
    code: 'PHN',
    name: 'Prajapati Nagar',
    line: 'Aqua',
    latitude: 21.1085,
    longitude: 79.0645,
    nearbyLandmarks: ['Prajapati Nagar Colony']
  },
  {
    code: 'BND',
    name: 'Bansi Bagh',
    line: 'Aqua',
    latitude: 21.1032,
    longitude: 79.0612,
    nearbyLandmarks: ['Bansi Bagh Garden']
  },
  {
    code: 'KHP',
    name: 'Khapri',
    line: 'Aqua',
    latitude: 21.0978,
    longitude: 79.0578,
    nearbyLandmarks: ['Khapri Village', 'MIDC Area']
  },

  // Orange Line (East-West Corridor) - Lokmanya Nagar to Automotive Square
  {
    code: 'LKN',
    name: 'Lokmanya Nagar',
    line: 'Orange',
    latitude: 21.1245,
    longitude: 79.0745,
    interchange: true,
    nearbyLandmarks: ['Lokmanya Nagar Market', 'Bus Stop']
  },
  {
    code: 'JHN',
    name: 'Jhansi Rani Square',
    line: 'Orange',
    latitude: 21.1268,
    longitude: 79.0812,
    nearbyLandmarks: ['Jhansi Rani Square']
  },
  {
    code: 'BHR',
    name: 'Bharat Nagar',
    line: 'Orange',
    latitude: 21.1292,
    longitude: 79.0878,
    nearbyLandmarks: ['Bharat Nagar Colony']
  },
  {
    code: 'CAS',
    name: 'Congress Nagar',
    line: 'Orange',
    latitude: 21.1315,
    longitude: 79.0945,
    nearbyLandmarks: ['Congress Nagar']
  },
  {
    code: 'SWR',
    name: 'Subhash Nagar',
    line: 'Orange',
    latitude: 21.1338,
    longitude: 79.1012,
    nearbyLandmarks: ['Subhash Nagar Market']
  },
  {
    code: 'MTR',
    name: 'Mihan Depot',
    line: 'Orange',
    latitude: 21.1362,
    longitude: 79.1078,
    nearbyLandmarks: ['MIHAN SEZ', 'Airport Road']
  },
  {
    code: 'AUT',
    name: 'Automotive Square',
    line: 'Orange',
    latitude: 21.1385,
    longitude: 79.1145,
    nearbyLandmarks: ['Automotive Square', 'Industrial Area']
  }
];

// Helper function to find station by name
export const findStationByName = (name: string): MetroStation | undefined => {
  return NAGPUR_METRO_STATIONS.find(station => 
    station.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(station.name.toLowerCase()) ||
    station.code.toLowerCase() === name.toLowerCase()
  );
};

// Helper function to find stations by line
export const getStationsByLine = (line: 'Aqua' | 'Orange'): MetroStation[] => {
  return NAGPUR_METRO_STATIONS.filter(station => station.line === line);
};

// Helper function to find interchange stations
export const getInterchangeStations = (): MetroStation[] => {
  return NAGPUR_METRO_STATIONS.filter(station => station.interchange);
};

// Helper function to get nearby stations
export const getNearbyStations = (station: MetroStation, count: number = 3): MetroStation[] => {
  const lineStations = getStationsByLine(station.line);
  const currentIndex = lineStations.findIndex(s => s.code === station.code);
  
  if (currentIndex === -1) return [];
  
  const start = Math.max(0, currentIndex - count);
  const end = Math.min(lineStations.length, currentIndex + count + 1);
  
  return lineStations.slice(start, end).filter(s => s.code !== station.code);
};
