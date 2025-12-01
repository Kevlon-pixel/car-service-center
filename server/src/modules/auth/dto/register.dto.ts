import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class RegisterDto {
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

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString({ message: 'Surname must be a string' })
  surname: string;

  @ApiProperty({
    example: '+7 999 123-45-67',
    description: 'User phone number',
  })
  @IsPhoneNumber('RU', { message: 'Phone must be a valid Russian number' })
  phone: string;
}
