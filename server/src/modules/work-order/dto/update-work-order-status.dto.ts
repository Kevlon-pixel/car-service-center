import { ApiProperty } from '@nestjs/swagger';
import { WorkOrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateWorkOrderStatusDto {
  @ApiProperty({
    enum: WorkOrderStatus,
    description: 'New status for the work order',
  })
  @IsEnum(WorkOrderStatus, {
    message: 'status must be a valid WorkOrderStatus value',
  })
  status: WorkOrderStatus;
}
