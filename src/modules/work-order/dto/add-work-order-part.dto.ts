import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddWorkOrderPartDto {
  @ApiProperty({
    example: 'part-id-123',
    description: 'Identifier of the spare part to add',
  })
  @IsString({ message: 'partId must be a string' })
  partId: string;

  @ApiPropertyOptional({
    example: 2,
    default: 1,
    description: 'Quantity of the spare part',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity?: number;
}
