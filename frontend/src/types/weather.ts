export type Weather = {
  _id: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  precipitation: number;
  rainChance?: number;
  visibility: number;
  description: string;
  city: string;
  timestamp: string;
};
