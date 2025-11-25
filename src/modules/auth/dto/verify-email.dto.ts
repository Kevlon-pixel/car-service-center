import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'uuid-token-from-email',
    description: 'Почтовый токен',
  })
  @IsString({ message: 'Токен должен передаваться в виде строки' })
  emailToken: string;
}
