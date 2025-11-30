import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({
    example: 'vehicle-id-123',
    description: 'Vehicle identifier that belongs to the client',
  })
  @IsString({ message: 'vehicleId must be a string' })
  vehicleId: string;

  @ApiProperty({
    example: 'service-id-123',
    description: 'Optional service to preselect',
  })
  @IsString({ message: 'serviceId must be a string' })
  serviceId: string;

  @ApiPropertyOptional({
    example: '2025-12-01T10:00:00.000Z',
    description: 'Preferred visit date (ISO string)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'desiredDate must be a valid ISO date string' })
  desiredDate?: string;

  @ApiPropertyOptional({
    example: 'Need car back by evening',
    description: 'Extra notes from client',
  })
  @IsOptional()
  @IsString({ message: 'comment must be a string' })
  @MaxLength(1000, { message: 'comment must be at most 1000 characters' })
  comment?: string;
}
