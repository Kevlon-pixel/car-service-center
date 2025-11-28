import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    example: 'fu1h389h0...',
    description: 'Refresh token',
  })
  @IsString({ message: 'refreshToken must be a string' })
  refreshToken: string;
}
