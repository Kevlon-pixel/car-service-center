import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateWorkOrderDto {
  @ApiProperty({
    example: 'request-id-123',
    description: 'Service request identifier to base the work order on',
  })
  @IsString({ message: 'requestId must be a string' })
  requestId: string;

  @ApiPropertyOptional({
    example: 'worker-id-456',
    description: 'Worker responsible for the work order',
  })
  @IsOptional()
  @IsString({ message: 'responsibleWorkerId must be a string' })
  responsibleWorkerId?: string;

  @ApiPropertyOptional({
    example: '2025-12-01T10:00:00.000Z',
    description: 'Planned date for the work order',
  })
  @IsOptional()
  @IsDateString({}, { message: 'plannedDate must be a valid ISO date string' })
  plannedDate?: string;
}
