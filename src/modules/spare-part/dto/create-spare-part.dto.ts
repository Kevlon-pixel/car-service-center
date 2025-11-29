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

export class CreateSparePartDto {
  @ApiProperty({ example: 'Brake pad', description: 'Spare part name' })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(255, { message: 'name must be at most 255 characters' })
  name: string;

  @ApiProperty({
    example: 'BP-1234',
    description: 'Unique part article number',
  })
  @IsString({ message: 'article must be a string' })
  @IsNotEmpty({ message: 'article is required' })
  @MaxLength(255, { message: 'article must be at most 255 characters' })
  article: string;

  @ApiProperty({
    example: 'pcs',
    description: 'Unit of measurement',
    required: false,
    default: 'pcs',
  })
  @IsOptional()
  @IsString({ message: 'unit must be a string' })
  @MaxLength(50, { message: 'unit must be at most 50 characters' })
  unit?: string;

  @ApiProperty({ example: 25.5, description: 'Price per unit' })
  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'price must be a valid number' },
  )
  @Min(0, { message: 'price cannot be negative' })
  price: number;

  @ApiProperty({
    example: 15,
    description: 'Current stock quantity',
    required: false,
    default: 0,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'stockQuantity must be an integer' })
  @Min(0, { message: 'stockQuantity cannot be negative' })
  stockQuantity?: number;

  @ApiProperty({
    example: true,
    description: 'Whether the part is available for sale',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
