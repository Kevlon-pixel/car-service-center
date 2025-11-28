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
    example: 'user@example.com',
    description: 'Email of the user',
  })
  @IsOptional()
  @IsEmail({}, { message: 'email must be valid' })
  email?: string;

  @ApiProperty({
    example: 'newStrongPassword',
    description: 'New password',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'newPassword must be at least 6 characters' })
  newPassword?: string;

  @ApiProperty({
    example: 'currentPassword123',
    description: 'Current password for confirmation',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'currentPassword must be at least 6 characters' })
  currentPassword?: string;

  @ApiProperty({
    example: 'John',
    description: 'First name',
  })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  name?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name',
  })
  @IsOptional()
  @IsString({ message: 'surname must be a string' })
  surname?: string;
}

export class UpdateUserDto extends PartialType(UpdateProfileDto) {
  @ApiProperty({ example: 'USER', description: 'System role' })
  @IsOptional()
  @IsEnum(SystemRole, { message: 'role must be a valid enum value' })
  role?: SystemRole;
}
