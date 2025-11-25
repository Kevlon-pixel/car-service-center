import { ApiProperty } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';

export class CreateUserDto extends RegisterDto {
  @ApiProperty({ example: 'USER', description: 'Роль пользователя' })
  @IsOptional()
  @IsEnum(SystemRole, { message: 'Роль должна передаваться как одна из enum' })
  role?: SystemRole;
}
