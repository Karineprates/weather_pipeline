import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';

type ForecastDaily = {
  time?: string[];
  weathercode?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
};

type ForecastHourly = {
  time?: string[];
  weathercode?: number[];
  temperature_2m?: number[];
  apparent_temperature?: number[]; // ✅ ADICIONADO — NECESSÁRIO!
  relativehumidity_2m?: number[];
  windspeed_10m?: number[];
  pressure_msl?: number[];
  precipitation?: number[];
};

type ForecastResponse = {
  daily?: ForecastDaily;
  hourly?: ForecastHourly;
};

type Location = {
  latitude: number;
  longitude: number;
  timezone: string;
  name?: string;
};

const WEATHER_CODE_MAP: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Principalmente claro',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Nevoeiro',
  48: 'Nevoeiro gelado',
  51: 'Garoa leve',
  53: 'Garoa moderada',
  55: 'Garoa densa',
  61: 'Chuva fraca',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  71: 'Neve fraca',
  73: 'Neve moderada',
  75: 'Neve forte',
  95: 'Trovoadas',
  96: 'Trovoadas com granizo leve',
  99: 'Trovoadas com granizo forte',
};

@Injectable()
export class ExternalService {
  private readonly api = axios.create({
    baseURL: 'https://api.open-meteo.com/v1',
    timeout: 10_000,
  });

  private readonly geocoding = axios.create({
    baseURL: 'https://geocoding-api.open-meteo.com/v1',
    timeout: 10_000,
  });

  private readonly latitude = Number(
    process.env.EXTERNAL_LATITUDE ?? '-27.5935',
  );
  private readonly longitude = Number(
    process.env.EXTERNAL_LONGITUDE ?? '-48.55854',
  );
  private readonly timezone = process.env.EXTERNAL_TIMEZONE ?? 'auto';

  private async resolveLocation(city?: string): Promise<Location> {
    if (!city) {
      return {
        latitude: this.latitude,
        longitude: this.longitude,
        timezone: this.timezone,
      };
    }

    const { data } = await this.geocoding.get('/search', {
      params: { name: city, count: 1, language: 'pt', format: 'json' },
    });

    const first = data?.results?.[0];

    if (!first) {
      throw new NotFoundException(
        'Cidade não encontrada para busca de previsão.',
      );
    }

    return {
      latitude: first.latitude,
      longitude: first.longitude,
      timezone: first.timezone ?? this.timezone,
      name: first.name,
    };
  }

  async listForecast(city?: string, page = 1, limit = 7) {
    const safeLimit = Math.min(Math.max(Number(limit) || 7, 1), 14);
    const safePage = Math.max(Number(page) || 1, 1);

    const location = await this.resolveLocation(city);

    const { data } = await this.api.get<ForecastResponse>('/forecast', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
        forecast_days: 14,
        daily:
          'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
      },
    });

    const daily = data.daily ?? {};
    const total = daily.time?.length ?? 0;

    const days = (daily.time ?? []).map((day, index) => ({
      date: day,
      description: WEATHER_CODE_MAP[daily.weathercode?.[index] ?? 0] ?? 'Clima',
      maxTemp: daily.temperature_2m_max?.[index] ?? null,
      minTemp: daily.temperature_2m_min?.[index] ?? null,
      rainChance: daily.precipitation_probability_max?.[index] ?? null,
      windMax: daily.wind_speed_10m_max?.[index] ?? null,
    }));

    const start = (safePage - 1) * safeLimit;
    const items = days.slice(start, start + safeLimit);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      location,
    };
  }

  async getDayDetail(date: string, city?: string) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Data inválida. Use YYYY-MM-DD.');
    }

    const formatted = parsed.toISOString().split('T')[0];

    const location = await this.resolveLocation(city);

    const { data } = await this.api.get<ForecastResponse>('/forecast', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
        start_date: formatted,
        end_date: formatted,
        hourly:
          'temperature_2m,relativehumidity_2m,windspeed_10m,pressure_msl,precipitation,weathercode',
      },
    });

    const hourly = data.hourly ?? {};
    const detail = (hourly.time ?? []).map((time, index) => ({
      time,
      temperature: hourly.temperature_2m?.[index] ?? null,
      humidity: hourly.relativehumidity_2m?.[index] ?? null,
      windSpeed: hourly.windspeed_10m?.[index] ?? null,
      pressure: hourly.pressure_msl?.[index] ?? null,
      precipitation: hourly.precipitation?.[index] ?? null,
      description:
        WEATHER_CODE_MAP[hourly.weathercode?.[index] ?? 0] ?? 'Clima',
    }));

    return {
      date: formatted,
      location,
      hours: detail,
    };
  }

  async getRecentCityWeather(city?: string) {
    const today = new Date();
    const start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const startDate = start.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const location = await this.resolveLocation(city);

    const { data } = await this.api.get<ForecastResponse>('/forecast', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
        start_date: startDate,
        end_date: endDate,
        hourly:
          'temperature_2m,apparent_temperature,relativehumidity_2m,windspeed_10m,pressure_msl,precipitation,weathercode',
        past_days: 1,
      },
    });

    const hourly = data.hourly ?? {};
    const hours = (hourly.time ?? []).map((time, index) => ({
      timestamp: time,
      temperature: hourly.temperature_2m?.[index] ?? 0,
      apparentTemperature: hourly.apparent_temperature?.[index] ?? null,
      humidity: hourly.relativehumidity_2m?.[index] ?? 0,
      windSpeed: hourly.windspeed_10m?.[index] ?? 0,
      pressure: hourly.pressure_msl?.[index] ?? 0,
      precipitation: hourly.precipitation?.[index] ?? 0,
      description:
        WEATHER_CODE_MAP[hourly.weathercode?.[index] ?? 0] ?? 'Clima',
      city: location.name ?? city ?? 'Cidade buscada',
    }));

    return { hours, location };
  }
}
