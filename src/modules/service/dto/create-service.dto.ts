import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Oil change', description: 'Service name' })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(255, { message: 'name must be at most 255 characters' })
  name: string;

  @ApiProperty({
    example: 'Replace engine oil and filter',
    description: 'Service description',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiProperty({ example: 49.99, description: 'Base price for the service' })
  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'basePrice must be a valid number' },
  )
  @Min(0, { message: 'basePrice cannot be negative' })
  basePrice: number;

  @ApiProperty({
    example: 60,
    description: 'Expected duration in minutes',
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'durationMin must be an integer' })
  @Min(0, { message: 'durationMin cannot be negative' })
  durationMin?: number;

  @ApiProperty({
    example: true,
    description: 'Whether the service is available for ordering',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
