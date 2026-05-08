import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const trimTransformedString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : (value as unknown);

export class UpdateTaskDto {
  @IsOptional()
  @Transform(trimTransformedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @Transform(trimTransformedString)
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
