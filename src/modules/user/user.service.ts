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
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateProfileDto } from './dto/update.dto';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UserService {
  private SALT_ROUNDS: number;
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.SALT_ROUNDS = Number(config.getOrThrow<number>('SALT_ROUNDS'));
  }

  /* Операции над пользователями */
  async createUser(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    try {
      const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

      const user = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });
      if (user) {
        throw new BadRequestException(
          'Пользователь с таким email уже существует',
        );
      }

      const newUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          role: dto.role,
          name: dto.name,
          surname: dto.surname,
        },
      });

      const { passwordHash, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }

      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Ошибка сервера при создании пользователя',
      );
    }
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const data: Prisma.UserUpdateInput = {};

    try {
      if (dto.email) {
        const user = await this.prisma.user.findUnique({
          where: {
            email: dto.email,
          },
        });

        if (user && user.id !== userId) {
          throw new ConflictException(
            'Пользователь с таким email уже существует',
          );
        }

        data.email = dto.email;
      }

      if (dto.newPassword) {
        if (!dto.currentPassword) {
          throw new BadRequestException('Нужен старый пароль');
        }

        const user = await this.prisma.user.findUnique({
          where: {
            id: userId,
          },
        });
        if (!user) {
          throw new BadRequestException('Пользователь не найден');
        }
        const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!ok) {
          throw new UnauthorizedException('Пароли не совпадают');
        }

        data.passwordHash = await bcrypt.hash(
          dto.newPassword,
          this.SALT_ROUNDS,
        );
      }

      if (dto.name) {
        data.name = dto.name;
      }

      if (dto.surname) {
        data.surname = dto.surname;
      }

      const { passwordHash, ...userWithoutPassword } =
        await this.prisma.user.update({
          where: { id: userId },
          data,
        });
      return userWithoutPassword;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Ошибка сервера при обновлении профиля',
      );
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }
      if (user.role === 'ADMIN') {
        throw new BadRequestException('Нельзя удалить администратора');
      }

      await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Ошибка сервера при удалении пользователя',
      );
    }
  }

  /* Поиск пользователей */
  async findAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    try {
      return await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          emailVerificationToken: true,
          role: true,
          name: true,
          surname: true,
          isEmailVerified: true,
          emailVerificationTokenExpire: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Ошибка сервера при поиске всех пользователей',
      );
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        return null;
      }

      return user;
    } catch (err) {
      throw new InternalServerErrorException(
        'Ошибка сервера при поиске пользователя по email',
      );
    }
  }

  async findUserByEmailToken(emailToken: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          emailVerificationToken: emailToken,
        },
      });

      if (!user) {
        return null;
      }

      return user;
    } catch (err) {
      throw new InternalServerErrorException(
        'Ошибка сервера при поиске пользователя по email токену',
      );
    }
  }

  async findUserById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        return null;
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (err) {
      throw new InternalServerErrorException(
        'Ошибка сервера при поиске пользователя по id',
      );
    }
  }

  /* Работа над верификацией пользовательской почты */
  async updateEmailVerifyToken(
    userId: string,
    token: string,
    tokenExpires: Date,
  ): Promise<User | null> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          emailVerificationToken: token,
          emailVerificationTokenExpire: tokenExpires,
        },
      });

      return user;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Не удалось обновить токен верификации почты пользователя',
      );
    }
  }

  async updateEmailVerify(userId: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpire: null,
        },
      });

      return user;
    } catch (err) {
      throw new InternalServerErrorException(
        'Не удалось обновить верификацию почты пользователя',
      );
    }
  }
}
