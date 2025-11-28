import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MailService } from '../mailer/mail.service';

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_SECRET: string;
  private readonly REFRESH_TOKEN_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRES_IN: JwtSignOptions['expiresIn'];
  private readonly REFRESH_TOKEN_EXPIRES_IN: JwtSignOptions['expiresIn'];
  private readonly CLIENT_URL: string;

  constructor(
    private readonly config: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {
    this.ACCESS_TOKEN_SECRET =
      this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.REFRESH_TOKEN_SECRET =
      this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
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
          throw new ConflictException('User with this email already verified');
        }

        if (
          user.emailVerificationTokenExpire !== null &&
          user.emailVerificationTokenExpire > now
        ) {
          throw new BadRequestException(
            'Verification email already sent, please check your inbox',
          );
        }

        const emailToken = randomUUID();
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        await this.userService.updateEmailVerifyToken(
          user.id,
          emailToken,
          expires,
        );

        const link = `${this.CLIENT_URL}/auth/verify?token=${emailToken}`;
        await this.mailService.sendVerification(user.email, link, expires);

        return {
          message:
            'User already exists but not verified. New verification email sent.',
        };
      }

      const newUser = await this.userService.createUser(dto);

      const emailToken = randomUUID();
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await this.userService.updateEmailVerifyToken(
        newUser.id,
        emailToken,
        expires,
      );

      const link = `${this.CLIENT_URL}/auth/verify?token=${emailToken}`;
      await this.mailService.sendVerification(newUser.email, link, expires);

      return {
        message: 'User created. Verification email sent.',
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    try {
      const user = await this.userService.findUserByEmail(dto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(
        dto.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!user.isEmailVerified) {
        throw new UnauthorizedException('Email is not verified');
      }

      const { accessToken, refreshToken, expiresAt } =
        await this.generateTokens(user.id);

      return { accessToken, refreshToken, expiresAt };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to login');
    }
  }

  async refresh(
    oldToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    try {
      const payload = this.jwtService.verify(oldToken, {
        secret: this.REFRESH_TOKEN_SECRET,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const { accessToken, refreshToken, expiresAt } =
        await this.generateTokens(payload.sub);

      return { accessToken, refreshToken, expiresAt };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyEmail(
    emailToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const user = await this.userService.findUserByEmailToken(emailToken);
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      user.emailVerificationTokenExpire === null ||
      user.emailVerificationTokenExpire < new Date()
    ) {
      throw new BadRequestException('Verification token has expired');
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
      throw new NotFoundException('User not found');
    }

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        type: 'access',
        role: user.role,
      },
      {
        secret: this.ACCESS_TOKEN_SECRET,
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
        secret: this.REFRESH_TOKEN_SECRET,
        expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      },
    );

    const decoded = this.jwtService.decode(refreshToken) as { exp?: number };
    if (!decoded?.exp) {
      throw new InternalServerErrorException('Failed to read token expiry');
    }
    const expiresAt = new Date(decoded.exp * 1000);

    return { accessToken, refreshToken, expiresAt };
  }
}
