import { ApiProperty } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: SystemRole,
    description: 'New role for the user',
  })
  @IsEnum(SystemRole, { message: 'role must be a valid system role' })
  role: SystemRole;
}
