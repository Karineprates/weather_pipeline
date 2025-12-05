import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { WeatherItemDto } from './dto/weather-item.dto';
import { Weather } from './schema/weather.schema';
import type { WeatherDocument } from './schema/weather.schema';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { UpdateWeatherDto } from './dto/update-weather.dto';
import { FilterWeatherDto } from './dto/filter-weather.dto';
import type { Response } from 'express';
import { ExternalService } from '../external/external.service';

type InsightCard = {
  title: string;
  status: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'positive';
};

type FindAllResult = {
  items: WeatherItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message?: string;
  error?: string;
};

@Injectable()
export class WeatherService {
  constructor(
    @InjectModel(Weather.name) private weatherModel: Model<WeatherDocument>,
    private externalService: ExternalService,
  ) {}

  async create(dto: CreateWeatherDto): Promise<Weather> {
    const payload: Partial<Weather> = {
      ...dto,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      pressure: dto.pressure ?? 0,
      precipitation: dto.precipitation ?? 0,
      rainChance: dto.rainChance ?? 0,
    };

    const created = await this.weatherModel.create(payload);

    return created;
  }

  async findAll(
    filter: FilterWeatherDto & { page?: number; limit?: number },
  ): Promise<FindAllResult> {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 50;

    const query = this.buildQuery(filter);

    const [docs, total] = await Promise.all([
      this.weatherModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.weatherModel.countDocuments(query),
    ]);

    // Converter documentos Mongoose → DTO
    const items: WeatherItemDto[] = docs.map((w) => ({
      timestamp: w.timestamp.toISOString(),
      temperature: w.temperature,
      apparentTemperature: null, // adicione se existir no schema
      humidity: w.humidity,
      windSpeed: w.windSpeed,
      pressure: w.pressure,
      precipitation: w.precipitation,
      rainChance: w.rainChance,
      description: w.description,
      city: w.city,
    }));

    // Fallback externo caso DB esteja vazio para a cidade filtrada
    if (total === 0 && filter.city) {
      try {
        const fallback = await this.externalService.getRecentCityWeather(
          filter.city,
        );

        if (fallback.hours.length > 0) {
          return {
            items: fallback.hours as WeatherItemDto[],
            total: fallback.hours.length,
            page: 1,
            limit: fallback.hours.length,
            totalPages: 1,
          };
        }
      } catch (error) {
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 1,
          message:
            'Não foi possível buscar dados externos para a cidade informada.',
          error:
            error instanceof Error
              ? error.message
              : 'Falha ao consultar fallback',
        };
      }
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Weather> {
    const weather = await this.weatherModel.findById(id).exec();
    if (!weather) throw new NotFoundException('Weather data not found');
    return weather;
  }

  async update(id: string, dto: UpdateWeatherDto): Promise<Weather> {
    const payload: Partial<Weather> = {};

    if (dto.temperature !== undefined) payload.temperature = dto.temperature;
    if (dto.humidity !== undefined) payload.humidity = dto.humidity;
    if (dto.windSpeed !== undefined) payload.windSpeed = dto.windSpeed;
    if (dto.pressure !== undefined) payload.pressure = dto.pressure;
    if (dto.precipitation !== undefined)
      payload.precipitation = dto.precipitation;
    if (dto.rainChance !== undefined) payload.rainChance = dto.rainChance;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.city !== undefined) payload.city = dto.city;

    if (dto.timestamp) payload.timestamp = new Date(dto.timestamp);

    const updated = await this.weatherModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Weather data not found');
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.weatherModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Weather data not found');
    return { message: 'Weather entry deleted successfully' };
  }

  async getInsights(filter: FilterWeatherDto & { prompt?: string } = {}) {
    const periodHours = 72;
    const query = this.buildQuery(filter);

    if (!filter.from && !filter.to) {
      query.timestamp = {
        ...(query.timestamp as Record<string, Date> | undefined),
        $gte: new Date(Date.now() - periodHours * 60 * 60 * 1000),
      };
    }

    const recent = await this.weatherModel
      .find(query)
      .sort({ timestamp: 1 })
      .exec();

    if (recent.length === 0) {
      return { message: 'Ainda não há dados suficientes para gerar insights.' };
    }

    const temps = recent.map((w) => w.temperature);
    const humidities = recent.map((w) => w.humidity);
    const winds = recent.map((w) => w.windSpeed);

    const avg = (list: number[]) =>
      list.reduce((sum, value) => sum + value, 0) / (list.length || 1);

    const avgTemp = avg(temps);
    const avgHumidity = avg(humidities);
    const avgWind = avg(winds);

    const trendValue = Number(
      (temps[temps.length - 1] - temps[0]) / Math.max(1, temps.length - 1),
    );

    const comfortScore = Math.max(
      0,
      Math.min(
        100,
        100 - Math.abs(avgTemp - 22) * 3 - Math.max(0, avgHumidity - 60),
      ),
    );

    const alerts: string[] = [];
    if (avgTemp >= 32)
      alerts.push('Calor intenso detectado, mantenha-se hidratado.');
    if (avgTemp <= 10)
      alerts.push('Frio acentuado, considere agasalhos adicionais.');
    if (avgHumidity >= 80)
      alerts.push('Umidade elevada pode indicar sensação de abafamento.');
    if (avgWind >= 30)
      alerts.push('Ventos fortes — redobre a atenção em áreas abertas.');

    const cards: InsightCard[] = [
      this.buildTemperatureCard(avgTemp),
      this.buildHumidityCard(avgHumidity),
      this.buildWindCard(avgWind),
    ];

    const summary = `Últimas ${periodHours / 24} dias: média de ${avgTemp.toFixed(
      1,
    )}°C, umidade média ${avgHumidity.toFixed(
      0,
    )}% e ventos de ${avgWind.toFixed(0)} km/h.`;

    const base = {
      avgTemp,
      avgHumidity,
      avgWind,
      trend: trendValue,
      comfortScore: Number(comfortScore.toFixed(0)),
      summary,
      headline: this.buildHeadline(cards, trendValue),
      cards,
      recommendations: this.buildRecommendations(avgTemp, avgHumidity, avgWind),
      alerts,
    };

    if (filter.prompt) {
      return {
        ...base,
        promptAnswer: this.buildPromptAnswer(filter.prompt, base),
      };
    }

    return base;
  }

  private buildHeadline(cards: InsightCard[], trend: number) {
    const criticalCard = cards.find((card) => card.severity === 'critical');
    if (criticalCard)
      return `${criticalCard.status}: ${criticalCard.description}`;

    if (trend > 0.5)
      return 'Temperaturas em leve elevação — prepare-se para calor moderado.';
    if (trend < -0.5)
      return 'Tendência de resfriamento gradual — mantenha agasalhos por perto.';

    return 'Clima estável nas últimas leituras, ideal para atividades ao ar livre.';
  }

  private buildRecommendations(
    avgTemp: number,
    avgHumidity: number,
    avgWind: number,
  ) {
    const recommendations: string[] = [];

    if (avgTemp >= 30)
      recommendations.push('Priorize hidratação e roupas leves durante o dia.');
    if (avgTemp <= 15)
      recommendations.push(
        'Use camadas extras e monitore a sensação térmica em áreas abertas.',
      );
    if (avgHumidity >= 80)
      recommendations.push(
        'Ambientes ventilados reduzem desconforto por umidade alta.',
      );
    if (avgWind >= 30)
      recommendations.push(
        'Evite trajetos longos de bicicleta ou moto em vias expostas ao vento.',
      );

    if (recommendations.length === 0) {
      recommendations.push(
        'Cenário confortável: bom momento para atividades ao ar livre.',
      );
    }

    return recommendations;
  }

  private buildTemperatureCard(avgTemp: number): InsightCard {
    if (avgTemp >= 34)
      return {
        title: 'Temperatura',
        status: 'Calor extremo',
        description:
          'Média acima de 34°C — risco de desconforto e desidratação.',
        severity: 'critical',
      };

    if (avgTemp >= 28)
      return {
        title: 'Temperatura',
        status: 'Tempo quente',
        description:
          'Temperaturas elevadas; priorize hidratação e locais ventilados.',
        severity: 'warning',
      };

    if (avgTemp <= 10)
      return {
        title: 'Temperatura',
        status: 'Frio acentuado',
        description:
          'Média abaixo de 10°C — sensação térmica pode ser ainda menor.',
        severity: 'critical',
      };

    if (avgTemp <= 17)
      return {
        title: 'Temperatura',
        status: 'Clima fresco',
        description:
          'Temperaturas amenas, apropriadas para atividades externas.',
        severity: 'info',
      };

    return {
      title: 'Temperatura',
      status: 'Agradável',
      description: 'Faixa confortável, sem extremos térmicos detectados.',
      severity: 'positive',
    };
  }

  private buildHumidityCard(avgHumidity: number): InsightCard {
    if (avgHumidity >= 85)
      return {
        title: 'Umidade',
        status: 'Muito alta',
        description:
          'Sensação de abafamento significativa e maior chance de chuva.',
        severity: 'warning',
      };

    if (avgHumidity >= 70)
      return {
        title: 'Umidade',
        status: 'Elevada',
        description: 'Ambiente úmido; ventilar ajuda a reduzir desconforto.',
        severity: 'info',
      };

    if (avgHumidity <= 35)
      return {
        title: 'Umidade',
        status: 'Muito baixa',
        description:
          'Ar seco — hidratação e cuidados com pele e vias aéreas recomendados.',
        severity: 'warning',
      };

    return {
      title: 'Umidade',
      status: 'Confortável',
      description: 'Faixa saudável, com baixo desconforto previsto.',
      severity: 'positive',
    };
  }

  private buildWindCard(avgWind: number): InsightCard {
    if (avgWind >= 45)
      return {
        title: 'Vento',
        status: 'Ventos fortes',
        description: 'Rajadas acima de 45 km/h — atenção em áreas abertas.',
        severity: 'critical',
      };

    if (avgWind >= 30)
      return {
        title: 'Vento',
        status: 'Rajadas moderadas',
        description: 'Possíveis rajadas que podem afetar deslocamentos leves.',
        severity: 'warning',
      };

    if (avgWind <= 8)
      return {
        title: 'Vento',
        status: 'Ar parado',
        description:
          'Baixa ventilação; atenção à sensação térmica em locais fechados.',
        severity: 'info',
      };

    return {
      title: 'Vento',
      status: 'Estável',
      description: 'Ventilação adequada, sem impactos relevantes previstos.',
      severity: 'positive',
    };
  }

  private buildPromptAnswer(prompt: string, base: Record<string, unknown>) {
    const summary = base.summary as string;
    const headline = (base.headline as string | undefined) ?? 'Clima estável';
    const comfort = base.comfortScore as number;

    return [
      `Pergunta: ${prompt.trim()}`,
      `• Headline: ${headline}`,
      `• Resumo: ${summary}`,
      `• Índice de conforto: ${comfort}% (quanto maior, mais agradável).`,
      'Recomendação: monitore variações súbitas e use filtros de cidade/data para granularidade.',
    ].join(' ');
  }

  private buildQuery(filter: FilterWeatherDto): FilterQuery<WeatherDocument> {
    const query: FilterQuery<WeatherDocument> = {};

    if (filter.city) {
      query.city = { $regex: new RegExp(filter.city, 'i') };
    }

    if (filter.from || filter.to) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (filter.from) range.$gte = new Date(filter.from);
      if (filter.to) range.$lte = new Date(filter.to);
      query.timestamp = range;
    }

    return query;
  }

  async exportCsv(filter: FilterWeatherDto, res: Response) {
    const query = this.buildQuery(filter);
    const items = await this.weatherModel
      .find(query)
      .sort({ timestamp: -1 })
      .exec();

    const header = [
      'timestamp',
      'city',
      'temperature',
      'humidity',
      'windSpeed',
      'description',
    ];
    const rows = items.map((item) => [
      item.timestamp.toISOString(),
      item.city,
      item.temperature,
      item.humidity,
      item.windSpeed,
      item.description,
    ]);

    const csv = [
      header.join(','),
      ...rows.map((r) => r.map((value) => this.escapeCsv(value)).join(',')),
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('weather.csv');
    res.send(csv);
  }

  async exportXlsx(filter: FilterWeatherDto, res: Response) {
    const query = this.buildQuery(filter);
    const items = await this.weatherModel
      .find(query)
      .sort({ timestamp: -1 })
      .exec();

    const tableRows = items
      .map(
        (item) =>
          `<tr><td>${item.timestamp.toISOString()}</td><td>${item.city}</td><td>${item.temperature}</td><td>${item.humidity}</td><td>${item.windSpeed}</td><td>${item.description}</td></tr>`,
      )
      .join('');

    const html = `<?xml version="1.0" encoding="UTF-8"?>\n<table><tr><th>Data</th><th>Cidade</th><th>Temperatura</th><th>Umidade</th><th>Vento</th><th>Condição</th></tr>${tableRows}</table>`;

    res.header('Content-Type', 'application/vnd.ms-excel');
    res.attachment('weather.xlsx');
    res.send(html);
  }

  private escapeCsv(value: unknown) {
    if (value === null || value === undefined) return '';

    const baseValue = (() => {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        return String(value);
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return JSON.stringify(value ?? '') ?? '';
    })();

    const stringValue = baseValue.replace(/"/g, '""');
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n')
    ) {
      return `"${stringValue}"`;
    }
    return stringValue;
  }
}
