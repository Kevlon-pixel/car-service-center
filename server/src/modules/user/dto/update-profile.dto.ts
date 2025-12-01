import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
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

  @ApiProperty({
    example: '+7 999 123-45-67',
    description: 'Phone number',
  })
  @IsOptional()
  @IsPhoneNumber('RU', { message: 'phone must be a valid Russian number' })
  phone?: string;
}
