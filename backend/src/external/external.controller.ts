import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExternalService } from './external.service';

@Controller('external')
@UseGuards(JwtAuthGuard)
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  @Get('forecast')
  listForecast(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('city') city?: string,
  ) {
    return this.externalService.listForecast(city, Number(page), Number(limit));
  }

  @Get('forecast/:date')
  getForecastDetail(@Param('date') date: string, @Query('city') city?: string) {
    return this.externalService.getDayDetail(date, city);
  }
}
