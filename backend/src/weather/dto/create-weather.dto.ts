import { IsNumber, IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { IsOptional } from 'class-validator';

export class CreateWeatherDto {
  @IsNumber()
  temperature: number;

  @IsNumber()
  humidity: number;

  @IsNumber()
  windSpeed: number;

  @IsOptional()
  @IsNumber()
  pressure?: number;

  @IsOptional()
  @IsNumber()
  precipitation?: number;

  @IsOptional()
  @IsNumber()
  rainChance?: number;

  @IsString()
  description: string;

  @IsString()
  city: string;

  @IsDateString()
  @IsNotEmpty()
  timestamp: string;
}
