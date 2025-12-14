import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Prisma, SystemRole, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UserFiltersDto,
  UserSortOption,
  UserStatusFilter,
} from './dto/user-filters.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.SALT_ROUNDS = Number(this.config.getOrThrow<number>('SALT_ROUNDS'));
  }

  async createUser(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
      const newUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          role: dto.role ?? SystemRole.USER,
          name: dto.name,
          surname: dto.surname,
          phone: dto.phone,
        },
      });

      const { passwordHash, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('User with this email already exists');
      }
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const data: Prisma.UserUpdateInput = {};

    if (dto.email) {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (user && user.id !== userId) {
        throw new ConflictException('User with this email already exists');
      }
      data.email = dto.email;
      data.isEmailVerified = false;
      data.emailVerificationToken = null;
      data.emailVerificationTokenExpire = null;
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!ok) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      data.passwordHash = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);
    }

    if (dto.name) {
      data.name = dto.name;
    }

    if (dto.surname) {
      data.surname = dto.surname;
    }

    if (dto.phone) {
      data.phone = dto.phone;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data,
      });
      const { passwordHash, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.role === SystemRole.ADMIN) {
        throw new BadRequestException('Cannot delete admin users');
      }

      await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async findAllUsers(
    filters: UserFiltersDto = {} as UserFiltersDto,
  ): Promise<
    Array<
      Pick<
        User,
        | 'id'
        | 'email'
        | 'role'
        | 'name'
        | 'surname'
        | 'phone'
        | 'isEmailVerified'
        | 'createdAt'
        | 'updatedAt'
      >
    >
  > {
    const where: Prisma.UserWhereInput = {};

    if (filters.status === UserStatusFilter.VERIFIED) {
      where.isEmailVerified = true;
    } else if (filters.status === UserStatusFilter.UNVERIFIED) {
      where.isEmailVerified = false;
    }

    if (filters.search) {
      where.surname = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const orderBy =
      filters.sort === UserSortOption.SURNAME_DESC
        ? { surname: 'desc' as const }
        : { surname: 'asc' as const };

    try {
      return await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          surname: true,
          phone: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy,
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch user by email');
    }
  }

  async findUserByEmailToken(emailToken: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { emailVerificationToken: emailToken },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to fetch user by email verification token',
      );
    }
  }

  async findUserById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return null;
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch user by id');
    }
  }

  async updateUserRole(
    userId: string,
    dto: UpdateUserRoleDto,
    actingUserId: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id === actingUserId) {
      throw new BadRequestException('Users cannot change their own role');
    }

    if (user.role === dto.role) {
      const { passwordHash, ...rest } = user;
      return rest;
    }

    if (user.role === SystemRole.ADMIN && dto.role !== SystemRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: SystemRole.ADMIN },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last admin user');
      }
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { role: dto.role },
      });
      const { passwordHash, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to update user role');
    }
  }

  async updateEmailVerifyToken(
    userId: string,
    token: string,
    tokenExpires: Date,
  ): Promise<User | null> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          emailVerificationToken: token,
          emailVerificationTokenExpire: tokenExpires,
        },
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Failed to set email verification token',
      );
    }
  }

  async updateEmailVerify(userId: string): Promise<User | null> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpire: null,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to confirm email');
    }
  }
}
