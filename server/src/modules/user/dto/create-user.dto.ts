import { ApiProperty } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';

export class CreateUserDto extends RegisterDto {
  @ApiProperty({ example: 'USER', description: 'System role' })
  @IsOptional()
  @IsEnum(SystemRole, { message: 'role must be a valid enum value' })
  role?: SystemRole;
}
