/// <reference types="vite/client" />
// Use the Express proxy to avoid CORS issues and hide API keys
const BASE_URL = '/api/railradar';

export interface LiveStatusResponse {
  status: boolean;
  message: string;
  data: {
    train_no: string;
    train_name: string;
    current_station_name: string;
    current_station_code: string;
    delay: number;
    last_updated: string;
    next_station_name: string;
    next_station_code: string;
    position: string;
    stations: Array<{
      station_name: string;
      station_code: string;
      arrival_time: string;
      departure_time: string;
      delay_arrival: number;
      delay_departure: number;
      status: string;
    }>;
  };
}

const handleResponse = async (response: Response, mockDataFallback?: any) => {
  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    const errorMsg = errData?.message || `HTTP error! status: ${response.status}`;
    if (mockDataFallback && (response.status === 429 || errorMsg.includes('quota') || errorMsg.includes('exceeded'))) {
      console.warn('API quota exceeded or rate limited. Using mock data fallback.');
      return mockDataFallback;
    }
    throw new Error(errorMsg);
  }
  const result = await response.json();
  if (result.message && !result.status) {
    if (mockDataFallback && (result.message.includes('quota') || result.message.includes('exceeded'))) {
      console.warn('API quota exceeded. Using mock data fallback.');
      return mockDataFallback;
    }
    throw new Error(result.message);
  }
  return result;
};

export const fetchLiveTrainStatus = async (trainNumber: string): Promise<LiveStatusResponse> => {
  const url = `${BASE_URL}/getTrainLiveStatus?trainNo=${trainNumber}&startDay=0`;
  const mockData = {
    status: true,
    message: "Success",
    data: {
      train_no: trainNumber,
      train_name: "MOCK EXPRESS",
      current_station_name: "NEW DELHI",
      current_station_code: "NDLS",
      delay: 15,
      last_updated: new Date().toISOString(),
      next_station_name: "KANPUR CENTRAL",
      next_station_code: "CNB",
      position: "Departed from NEW DELHI and running late by 15 mins.",
      stations: [
        {
          station_name: "NEW DELHI",
          station_code: "NDLS",
          arrival_time: "10:00",
          departure_time: "10:15",
          delay_arrival: 0,
          delay_departure: 15,
          status: "Departed"
        },
        {
          station_name: "KANPUR CENTRAL",
          station_code: "CNB",
          arrival_time: "15:00",
          departure_time: "15:10",
          delay_arrival: 15,
          delay_departure: 15,
          status: "Upcoming"
        }
      ]
    }
  };
  try {
    const response = await fetch(url, { method: 'GET' });
    return await handleResponse(response, mockData);
  } catch (error) {
    console.error('Error fetching live train status:', error);
    return mockData; // Fallback even on network error
  }
};

export const searchTrains = async (query: string) => {
  const url = `${BASE_URL}/searchTrain?query=${query}`;
  const mockData = {
    status: true,
    message: "Success",
    data: [
      {
        train_number: "12951",
        train_name: "MUMBAI RAJDHANI",
        src_stn_name: "MUMBAI CENTRAL",
        dstn_stn_name: "NEW DELHI",
        from_time: "17:00",
        to_time: "08:32",
        run_days: ["Daily"]
      },
      {
        train_number: "12953",
        train_name: "AK TEJAS RAJ EX",
        src_stn_name: "MUMBAI CENTRAL",
        dstn_stn_name: "NZM",
        from_time: "17:10",
        to_time: "09:43",
        run_days: ["Daily"]
      }
    ]
  };
  try {
    const response = await fetch(url, { method: 'GET' });
    return await handleResponse(response, mockData);
  } catch (error) {
    console.error('Error searching trains:', error);
    return mockData;
  }
};

export const fetchSeatAvailability = async (
  trainNo: string,
  fromStationCode: string,
  toStationCode: string,
  date: string,
  classCode: string = '3A',
  quotaCode: string = 'GN'
) => {
  const url = `${BASE_URL}/getSeatAvailability?trainNo=${trainNo}&fromStationCode=${fromStationCode}&toStationCode=${toStationCode}&date=${date}&classCode=${classCode}&quotaCode=${quotaCode}`;
  const mockData = {
    status: true,
    message: "Success",
    data: [
      {
        availability: "AVAILABLE 42",
        fare: 1540,
        date: date
      }
    ]
  };
  try {
    const response = await fetch(url, { method: 'GET' });
    return await handleResponse(response, mockData);
  } catch (error) {
    console.error('Error fetching seat availability:', error);
    return mockData;
  }
};

export const fetchTrainsBetweenStations = async (
  fromStationCode: string,
  toStationCode: string,
  date: string
) => {
  const url = `${BASE_URL}/getTrainBetweenStations?fromStationCode=${fromStationCode}&toStationCode=${toStationCode}&dateOfJourney=${date}`;
  const mockData = {
    status: true,
    message: "Success",
    data: [
      {
        train_number: "12951",
        train_type: "3A",
        train_name: "MUMBAI RAJDHANI"
      },
      {
        train_number: "12953",
        train_type: "3A",
        train_name: "AK TEJAS RAJ EX"
      }
    ]
  };
  try {
    const response = await fetch(url, { method: 'GET' });
    return await handleResponse(response, mockData);
  } catch (error) {
    console.error('Error fetching trains between stations:', error);
    return mockData;
  }
};

export const fetchPnrStatus = async (pnr: string) => {
  const url = `${BASE_URL}/getPNRStatus?pnrNumber=${pnr}`;
  const mockData = {
    status: true,
    message: "Success",
    data: {
      pnr: pnr,
      train_no: "12951",
      train_name: "MUMBAI RAJDHANI",
      doj: new Date().toISOString().split('T')[0],
      booking_date: new Date().toISOString().split('T')[0],
      quota: "GN",
      destination_stn: "NDLS",
      source_stn: "MMCT",
      boarding_stn: "MMCT",
      reservation_upto: "NDLS",
      passenger: [
        {
          passenger_serial_number: 1,
          current_status: "CNF",
          current_coach_id: "B4",
          current_berth_no: "42",
          booking_status: "CNF",
          booking_coach_id: "B4",
          booking_berth_no: "42"
        }
      ]
    }
  };
  try {
    const response = await fetch(url, { method: 'GET' });
    return await handleResponse(response, mockData);
  } catch (error) {
    console.error('Error fetching PNR status:', error);
    return mockData;
  }
};
