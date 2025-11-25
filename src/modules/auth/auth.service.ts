import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { MailService } from '../mailer/mail.service';

@Injectable()
export class AuthService {
  private JWT_SECRET: string;
  private ACCESS_TOKEN_EXPIRES_IN: JwtSignOptions['expiresIn'];
  private REFRESH_TOKEN_EXPIRES_IN: JwtSignOptions['expiresIn'];
  private CLIENT_URL: string;

  constructor(
    private readonly config: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {
    this.JWT_SECRET = this.config.getOrThrow<string>('JWT_SECRET');
    this.ACCESS_TOKEN_EXPIRES_IN = this.config.getOrThrow<string>(
      'ACCESS_TOKEN_EXPIRES_IN',
    ) as JwtSignOptions['expiresIn'];
    this.REFRESH_TOKEN_EXPIRES_IN = this.config.getOrThrow<string>(
      'REFRESH_TOKEN_EXPIRES_IN',
    ) as JwtSignOptions['expiresIn'];
    this.CLIENT_URL = this.config.getOrThrow<string>('CLIENT_URL');
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    try {
      const now = new Date();

      const user = await this.userService.findUserByEmail(dto.email);
      if (user) {
        if (user.isEmailVerified) {
          throw new ConflictException('Пользователь уже зарегистрирован');
        }

        if (
          user.emailVerificationTokenExpire! !== null &&
          user.emailVerificationTokenExpire > now
        ) {
          throw new BadRequestException(
            'Ссылка ещё действительна, проверьте почту',
          );
        }

        const emailToken = randomUUID();

        const expires = new Date();
        const msInHour = 60 * 60 * 1000;
        const newExpires = new Date(expires.getTime() + msInHour);

        await this.userService.updateEmailVerifyToken(
          user.id,
          emailToken,
          newExpires,
        );

        const link = `${this.CLIENT_URL}/auth/verify?token=${emailToken}`;
        await this.mailService.sendVerification(user.email, link, newExpires);

        return {
          message: 'Письмо с подтверждением отправлено повторно',
        };
      }

      const newUser = await this.userService.createUser(dto);

      const emailToken = randomUUID();

      const expires = new Date();
      const msInHour = 60 * 60 * 1000;
      const newExpires = new Date(expires.getTime() + msInHour);

      await this.userService.updateEmailVerifyToken(
        newUser.id,
        emailToken,
        newExpires,
      );

      const link = `${this.CLIENT_URL}/auth/verify?token=${emailToken}`;
      await this.mailService.sendVerification(newUser.email, link, newExpires);

      return {
        message: 'Письмо с ссылкой отправлено на почту',
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Ошибка сервера при регистрации');
    }
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    try {
      const user = await this.userService.findUserByEmail(dto.email);
      if (!user) {
        throw new UnauthorizedException('Неверная почта или пароль');
      }

      const isPasswordValid = await bcrypt.compare(
        dto.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Неверная почта или пароль');
      }

      if (!user.isEmailVerified) {
        throw new UnauthorizedException('Почта пользователя не подтверждена');
      }

      const { accessToken, refreshToken, expiresAt } =
        await this.generateTokens(user.id);

      return { accessToken, refreshToken, expiresAt };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      console.error(err);
      throw new InternalServerErrorException('Ошибка сервера при входе');
    }
  }

  async refresh(
    oldToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    try {
      const payload = this.jwtService.verify(oldToken, {
        secret: this.JWT_SECRET,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Некорректный тип токена');
      }

      const { accessToken, refreshToken, expiresAt } =
        await this.generateTokens(payload.sub);

      return { accessToken, refreshToken, expiresAt };
    } catch (err) {
      throw new UnauthorizedException(
        'Некорректный или просроченный refresh токен',
      );
    }
  }

  async verifyEmail(
    emailToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const user = await this.userService.findUserByEmailToken(emailToken);
    if (!user) {
      throw new BadRequestException('Неверная почта пользователя');
    }

    if (user.emailVerificationTokenExpire! < new Date()) {
      throw new BadRequestException('Токен истёк');
    }

    await this.userService.updateEmailVerify(user.id);

    const { accessToken, refreshToken, expiresAt } = await this.generateTokens(
      user.id,
    );

    return { accessToken, refreshToken, expiresAt };
  }

  async generateTokens(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        type: 'access',
        role: user.role,
      },
      {
        secret: this.JWT_SECRET,
        expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        type: 'refresh',
        role: user.role,
      },
      {
        secret: this.JWT_SECRET,
        expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      },
    );

    const expiresAt = new Date();
    const days = parseInt(String(this.REFRESH_TOKEN_EXPIRES_IN));
    expiresAt.setDate(expiresAt.getDate() + days);

    return { accessToken, refreshToken, expiresAt };
  }
}
