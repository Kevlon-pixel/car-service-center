import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'uuid-token-from-email',
    description: 'Email verification token from the link',
  })
  @IsString({ message: 'emailToken must be a string' })
  emailToken: string;
}
