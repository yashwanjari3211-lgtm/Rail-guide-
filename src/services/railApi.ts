/// <reference types="vite/client" />
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = import.meta.env.VITE_RAPIDAPI_HOST;
const BASE_URL = `https://${API_HOST}/api/v1`;

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

export const fetchLiveTrainStatus = async (trainNumber: string): Promise<LiveStatusResponse> => {
  const url = `${BASE_URL}/getTrainLiveStatus?trainNo=${trainNumber}&startDay=0`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching live train status:', error);
    throw error;
  }
};

export const searchTrains = async (query: string) => {
  const url = `${BASE_URL}/searchTrain?query=${query}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error searching trains:', error);
    throw error;
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
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching seat availability:', error);
    throw error;
  }
};

export const fetchTrainsBetweenStations = async (
  fromStationCode: string,
  toStationCode: string,
  date: string
) => {
  const url = `${BASE_URL}/getTrainBetweenStations?fromStationCode=${fromStationCode}&toStationCode=${toStationCode}&dateOfJourney=${date}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching trains between stations:', error);
    throw error;
  }
};

export const fetchPnrStatus = async (pnr: string) => {
  const url = `${BASE_URL}/getPNRStatus?pnrNumber=${pnr}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching PNR status:', error);
    throw error;
  }
};
