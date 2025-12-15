import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class FinancialReportQueryDto {
  @ApiProperty({
    description: 'Дата начала периода (в формате ISO)',
    example: '2025-12-01T00:00:00.000Z',
  })
  @IsDateString({}, { message: 'fromDate должен быть в формате ISO' })
  fromDate!: string;

  @ApiProperty({
    description: 'Дата окончания периода (в формате ISO)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsDateString({}, { message: 'toDate должен быть в формате ISO' })
  toDate!: string;
}
