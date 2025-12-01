import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddWorkOrderServiceDto {
  @ApiProperty({
    example: 'service-id-123',
    description: 'Identifier of the service to add',
  })
  @IsString({ message: 'serviceId must be a string' })
  serviceId: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'How many times the service is performed',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity?: number;
}
