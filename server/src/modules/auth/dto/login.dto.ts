import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'vl0d1sla8@mail.ru',
    description: 'User email',
  })
  @IsEmail({}, { message: 'email must be valid' })
  email: string;

  @ApiProperty({
    example: '123123',
    description: 'User password',
    minLength: 6,
  })
  @MinLength(6, {
    message: 'Password must be at least 6 characters',
  })
  @IsString({ message: 'Password must be a string' })
  password: string;
}
