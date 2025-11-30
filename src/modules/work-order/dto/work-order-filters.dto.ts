import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class WorkOrderFiltersDto {
  @ApiPropertyOptional({
    enum: WorkOrderStatus,
    description: 'Filter by work order status',
  })
  @IsOptional()
  @IsEnum(WorkOrderStatus, {
    message: 'status must be a valid WorkOrderStatus value',
  })
  status?: WorkOrderStatus;

  @ApiPropertyOptional({
    example: 'client-id-123',
    description: 'Filter by client',
  })
  @IsOptional()
  @IsString({ message: 'clientId must be a string' })
  clientId?: string;

  @ApiPropertyOptional({
    example: 'vehicle-id-123',
    description: 'Filter by vehicle',
  })
  @IsOptional()
  @IsString({ message: 'vehicleId must be a string' })
  vehicleId?: string;

  @ApiPropertyOptional({
    example: 'worker-id-123',
    description: 'Filter by responsible worker',
  })
  @IsOptional()
  @IsString({ message: 'responsibleWorkerId must be a string' })
  responsibleWorkerId?: string;
}
