import { ApiProperty } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateRequestStatusDto {
  @ApiProperty({
    enum: RequestStatus,
    example: RequestStatus.CONFIRMED,
    description: 'New status for the service request',
  })
  @IsEnum(RequestStatus, {
    message: 'status must be a valid RequestStatus value',
  })
  status: RequestStatus;
}
