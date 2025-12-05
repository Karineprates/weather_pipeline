import { IsString, IsNotEmpty } from 'class-validator';

export class QueryWeatherDto {
  @IsString()
  @IsNotEmpty()
  city: string;
}
