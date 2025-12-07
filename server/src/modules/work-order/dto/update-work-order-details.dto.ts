import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateWorkOrderDetailsDto {
  @ApiPropertyOptional({
    example: 'worker-id-456',
    description: 'Responsible worker for the work order',
  })
  @IsOptional()
  @Transform(({ value }) => (value === null ? undefined : value))
  @IsString({ message: 'responsibleWorkerId must be a string' })
  responsibleWorkerId?: string | null;

  @ApiPropertyOptional({
    example: '2025-12-01T10:00:00.000Z',
    description: 'Planned date for the work order',
  })
  @IsOptional()
  @Transform(({ value }) => (value === null ? undefined : value))
  @IsDateString({}, { message: 'plannedDate must be a valid ISO date string' })
  plannedDate?: string | null;
}
