import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { WeatherService } from './weather.service';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { UpdateWeatherDto } from './dto/update-weather.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilterWeatherDto } from './dto/filter-weather.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { InsightsRequestDto } from './dto/insights-request.dto';

@Controller('weather')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Post()
  create(@Body() dto: CreateWeatherDto) {
    return this.weatherService.create(dto);
  }

  @Get()
  findAll(
    @Query()
    query: FilterWeatherDto & { page?: string; limit?: string },
  ) {
    return this.weatherService.findAll({
      ...query,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }

  // 🔥🔥🔥 IMPORTANTE: marque como pública
  @Get('insights')
  @Public()
  findInsights(@Query() query: FilterWeatherDto) {
    return this.weatherService.getInsights(query);
  }

  @Post('insights')
  @Public()
  createInsightFromPrompt(@Body() body: InsightsRequestDto) {
    return this.weatherService.getInsights(body);
  }

  @Get('export/csv')
  exportCsv(@Query() query: FilterWeatherDto, @Res() res: Response) {
    return this.weatherService.exportCsv(query, res);
  }

  @Get('export/xlsx')
  exportXlsx(@Query() query: FilterWeatherDto, @Res() res: Response) {
    return this.weatherService.exportXlsx(query, res);
  }

  @Post('logs')
  @Public()
  createFromWorker(@Body() dto: CreateWeatherDto) {
    return this.weatherService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.weatherService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateWeatherDto) {
    return this.weatherService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.weatherService.remove(id);
  }
}
