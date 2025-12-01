import { ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class ServiceRequestFiltersDto {
  @ApiPropertyOptional({
    enum: RequestStatus,
    description: 'Filter by request status',
  })
  @IsOptional()
  @IsEnum(RequestStatus, {
    message: 'status must be a valid RequestStatus value',
  })
  status?: RequestStatus;

  @ApiPropertyOptional({
    example: '2025-12-01T00:00:00.000Z',
    description: 'Desired date from (inclusive)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'fromDate must be a valid ISO date string' })
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Desired date to (inclusive)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'toDate must be a valid ISO date string' })
  toDate?: string;

  @ApiPropertyOptional({
    example: 'client-id-123',
    description: 'Filter by client identifier',
  })
  @IsOptional()
  @IsString({ message: 'clientId must be a string' })
  clientId?: string;
}
