import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateVehicleDto {
  @ApiProperty({
    example: 'A666AA161',
    description: 'License plate number',
  })
  @IsOptional()
  @IsString({ message: 'licensePlate must be a string' })
  licensePlate?: string;
}
