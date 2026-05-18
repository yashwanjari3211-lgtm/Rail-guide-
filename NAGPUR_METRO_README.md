# Nagpur Metro Integration

This document describes the Nagpur Metro integration for RailGuide AI.

## Overview

The system now includes complete knowledge of Nagpur Metro rail network with 17 operational stations across 2 lines (Aqua and Orange).

## Metro Lines

### Aqua Line (North-South Corridor)
- **Stations**: 10
- **Route**: Sitabuldi → Khapri
- **Key Stations**: Sitabuldi (Central Hub), Lokmanya Nagar (Interchange), Ajni Square (Near Railway Station)

### Orange Line (East-West Corridor)
- **Stations**: 7
- **Route**: Lokmanya Nagar → Automotive Square
- **Key Stations**: Lokmanya Nagar (Interchange), Mihan Depot (Airport Road), Automotive Square

## Key Features

### 1. Multi-Modal Journey Planning

The AI now provides comprehensive journey plans that include:

```
Example: Gondia → Lokmanya Nagar, Nagpur

1. Auto/Uber from Gondia to Gondia Railway Station (5 km, ~15 min)
2. Train from Gondia to Nagpur Junction (NGP)
   - Train Number: [available]
   - Departure: [time]
   - Arrival: [time]
3. Walk/Auto to Ajni Square Metro Station (2 km)
4. Take Aqua Line metro towards Sitabuldi (3 stops)
5. Get off at Lokmanya Nagar station
6. Walk to final destination (300m)
```

### 2. Station Information

Each station includes:
- Station code and full name
- Line color (Aqua or Orange)
- Interchange capability
- Nearby landmarks
- GPS coordinates

### 3. Smart Routing

The system automatically:
- Identifies if origin/destination are in Nagpur
- Finds nearest railway station to user location
- Finds nearest metro station to destination
- Calculates walking distances
- Suggests optimal interchange points
- Provides estimated travel times

## Usage

### Voice Interaction

Simply ask: 
- "How to reach Lokmanya Nagar from Gondia?"
- "Plan journey from my location to Sitabuldi"
- "What's the best way to reach Ajni Square?"

### Text Interaction

Type your query in the AI Guide tab, and the system will:
1. Detect Nagpur-related queries
2. Plan multi-modal route
3. Show detailed steps
4. Include metro information

## API Integration

### Metro Station Data

```typescript
import { NAGPUR_METRO_STATIONS, findStationByName } from './data/nagpurMetroStations';

// Find station by name
const station = findStationByName('Lokmanya Nagar');
// Returns: { code: 'LNR', name: 'Lokmanya Nagar', line: 'Aqua', ... }

// Get all stations on a line
import { getStationsByLine } from './data/nagpurMetroStations';
const aquaLineStations = getStationsByLine('Aqua');
```

### Distance Calculations

```typescript
import { calculateDistance, formatDistance } from './utils';

// Calculate distance between coordinates
const distance = calculateDistance(21.1458, 79.0882, 21.1245, 79.0745);
// Returns: distance in km

// Format for display
const formatted = formatDistance(distance);
// Returns: "2.8 km" or "350 m"
```

## Station List

### Aqua Line (10 stations)
1. Sitabuldi (STB) - Central Hub, Interchange
2. Ram Jhula (RAM)
3. Zero Mile Freedom Park (ZSQ)
4. Vanaz (VAN)
5. Lokmanya Nagar (LNR) - Interchange
6. Telephone Exchange Square (TAD)
7. Ajni Square (AJN) - Near Ajni Railway Station
8. Prajapati Nagar (PHN)
9. Bansi Bagh (BND)
10. Khapri (KHP) - Terminus

### Orange Line (7 stations)
1. Lokmanya Nagar (LKN) - Interchange
2. Jhansi Rani Square (JHN)
3. Bharat Nagar (BHR)
4. Congress Nagar (CAS)
5. Subhash Nagar (SWR)
6. Mihan Depot (MTR) - Airport Road
7. Automotive Square (AUT) - Terminus

## Important Connections

### Railway to Metro
- **Nagpur Junction (NGP)** → Nearest Metro: Sitabuldi (STB) - 2.5 km
- **Ajni Railway Station** → Nearest Metro: Ajni Square (AJN) - 500m

### Key Interchange
- **Lokmanya Nagar**: Only interchange station connecting Aqua and Orange Lines

## Technical Details

### Data Source
- Nagpur Metro Rail Corporation Limited (NMRCL)
- Official station layouts and coordinates

### Update Frequency
- Station data: Static (last updated: 2025)
- Train schedules: Real-time via Railradar API
- Live status: Real-time via Gemini AI

### Performance
- Station lookup: O(n) where n = 17 stations
- Distance calculation: Haversine formula
- Route planning: AI-powered with Google Maps integration

## Future Enhancements

- [ ] Real-time metro train tracking
- [ ] Metro fare calculation
- [ ] Peak hour predictions
- [ ] Platform information
- [ ] Interchange walking time estimates
- [ ] Integration with Nagpur bus routes

## Support

For issues or questions about Nagpur Metro integration:
- Check station codes in the data file
- Verify coordinates for distance calculations
- Review AI prompts for journey planning
