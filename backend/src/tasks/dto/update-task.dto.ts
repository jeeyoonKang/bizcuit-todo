import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsDateString()
  deadline?: string | null;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
