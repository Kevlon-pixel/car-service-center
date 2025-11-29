import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AddVehicleDto {
  @ApiProperty({ example: 'Toyota', description: 'Vehicle make/brand' })
  @IsString({ message: 'make must be a string' })
  make: string;

  @ApiProperty({ example: 'Camry', description: 'Vehicle model' })
  @IsString({ message: 'model must be a string' })
  model: string;

  @ApiProperty({
    example: 2020,
    description: 'Production year',
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'year must be an integer' })
  @Min(1886, { message: 'year must be 1886 or later' })
  @Max(new Date().getFullYear() + 1, {
    message: 'year cannot be in the distant future',
  })
  year?: number;

  @ApiProperty({
    example: '4T1BE46K17U123456',
    description: 'VIN number',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'vin must be a string' })
  vin?: string;

  @ApiProperty({
    example: 'A666AA161',
    description: 'License plate number',
  })
  @IsString({ message: 'licensePlate must be a string' })
  licensePlate: string;
}
