export class WeatherItemDto {
  timestamp: string;
  temperature: number;
  apparentTemperature?: number | null;
  humidity: number;
  windSpeed: number;
  pressure: number;
  precipitation: number;
  rainChance?: number;
  description: string;
  city: string;
}
