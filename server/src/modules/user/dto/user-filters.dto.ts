import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum UserStatusFilter {
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified',
}

export enum UserSortOption {
  SURNAME_ASC = 'surname-asc',
  SURNAME_DESC = 'surname-desc',
}

export class UserFiltersDto {
  @ApiPropertyOptional({
    enum: UserStatusFilter,
    description: 'Filter by email verification status',
  })
  @IsOptional()
  @IsEnum(UserStatusFilter, { message: 'status must be verified or unverified' })
  status?: UserStatusFilter;

  @ApiPropertyOptional({
    enum: UserSortOption,
    description: 'Sort users by surname',
    default: UserSortOption.SURNAME_ASC,
  })
  @IsOptional()
  @IsEnum(UserSortOption, {
    message: 'sort must be surname-asc or surname-desc',
  })
  sort?: UserSortOption;

  @ApiPropertyOptional({
    description: 'Search users by surname (case-insensitive, partial match)',
    example: 'Иванов',
  })
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  @MinLength(1, { message: 'search must not be empty' })
  search?: string;
}
