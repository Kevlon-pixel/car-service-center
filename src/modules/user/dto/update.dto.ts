import { ApiProperty, PartialType } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';

import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'vl0d1sla8@mail.ru',
    description: 'Email пользователя',
  })
  @IsOptional()
  @IsEmail({}, { message: 'email должен быть написан верно' })
  email?: string;

  @ApiProperty({
    example: '321321',
    description: 'Новый пароль',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'пароль должен быть строкой' })
  newPassword?: string;

  @ApiProperty({
    example: '123123',
    description: 'Текущий пароль',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'пароль должен быть строкой' })
  currentPassword?: string;

  @ApiProperty({
    example: 'Иван',
    description: 'Имя пользователя',
  })
  @IsOptional()
  @IsString({ message: 'имя должено быть строкой' })
  name?: string;

  @ApiProperty({
    example: 'Иванов',
    description: 'Фамилия пользователя',
  })
  @IsOptional()
  @IsString({ message: 'фамилия должена быть строкой' })
  surname?: string;
}

export class UpdateUserDto extends PartialType(UpdateProfileDto) {
  @ApiProperty({ example: 'USER', description: 'Роль пользователя' })
  @IsOptional()
  @IsEnum(SystemRole, { message: 'Роль должна передаваться как одна из enum' })
  role?: SystemRole;
}
