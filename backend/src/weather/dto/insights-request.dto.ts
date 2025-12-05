import { IsOptional, IsString, IsDateString } from 'class-validator';

export class InsightsRequestDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  prompt?: string;
}
