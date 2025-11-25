import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'vl0d1sla8@mail.ru',
    description: 'Email пользователя',
  })
  @IsEmail({}, { message: 'email должен быть написан верно' })
  email: string;

  @ApiProperty({
    example: '123123',
    description: 'Пароль пользователя',
    minLength: 6,
  })
  @MinLength(6, {
    message: 'пароль должен быть не менее 6 символов',
  })
  @IsString({ message: 'пароль должен быть строкой' })
  password: string;
}
