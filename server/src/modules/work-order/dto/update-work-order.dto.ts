import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

class WorkOrderServiceInputDto {
  @ApiPropertyOptional({ example: 'service-id-123' })
  @IsString({ message: 'serviceId must be a string' })
  serviceId!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;
}

class WorkOrderPartInputDto {
  @ApiPropertyOptional({ example: 'part-id-123' })
  @IsString({ message: 'partId must be a string' })
  partId!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;
}

export class UpdateWorkOrderDto {
  @ApiPropertyOptional({
    enum: WorkOrderStatus,
    description: 'New work order status',
  })
  @IsOptional()
  @IsEnum(WorkOrderStatus, { message: 'status must be a valid work order status' })
  status?: WorkOrderStatus;

  @ApiPropertyOptional({
    example: '2025-12-01T10:00:00.000Z',
    description: 'Planned date for the work order',
  })
  @IsOptional()
  @IsDateString({}, { message: 'plannedDate must be a valid ISO date string' })
  plannedDate?: string | null;

  @ApiPropertyOptional({
    example: 'worker-id-456',
    description: 'Responsible worker for the work order',
  })
  @IsOptional()
  @IsString({ message: 'responsibleWorkerId must be a string' })
  responsibleWorkerId?: string | null;

  @ApiPropertyOptional({
    type: [WorkOrderServiceInputDto],
    description: 'Full list of service positions for the work order',
  })
  @IsOptional()
  @IsArray({ message: 'services must be an array' })
  @ValidateNested({ each: true })
  @Type(() => WorkOrderServiceInputDto)
  services?: WorkOrderServiceInputDto[];

  @ApiPropertyOptional({
    type: [WorkOrderPartInputDto],
    description: 'Full list of part positions for the work order',
  })
  @IsOptional()
  @IsArray({ message: 'parts must be an array' })
  @ValidateNested({ each: true })
  @Type(() => WorkOrderPartInputDto)
  parts?: WorkOrderPartInputDto[];
}
