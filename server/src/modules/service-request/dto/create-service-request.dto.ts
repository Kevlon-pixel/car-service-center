import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({
    example: 'vehicle-id-123',
    description: 'Vehicle identifier that belongs to the client',
  })
  @IsString({ message: 'vehicleId must be a string' })
  vehicleId: string;

  @ApiPropertyOptional({
    example: '2025-12-01T10:00:00.000Z',
    description: 'Preferred visit date (ISO string)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'desiredDate must be a valid ISO date string' })
  desiredDate?: string;

  @ApiProperty({
    example: 'Need car back by evening',
    description: 'Extra notes from client',
  })
  @IsString({ message: 'comment must be a string' })
  @MaxLength(1000, { message: 'comment must be at most 1000 characters' })
  comment: string;
}
