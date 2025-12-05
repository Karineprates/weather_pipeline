import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value?.trim() === '' ? undefined : value,
  )
  password?: string;

  @IsString()
  @IsOptional()
  role?: string;
}
