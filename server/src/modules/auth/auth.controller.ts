import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Request } from 'express';
import { isDev } from 'src/shared/utils/is-dev.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Register new user and send verification email' })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Confirm email by verification token' })
  @Post('verify')
  async verify(@Res({ passthrough: true }) res, @Body() dto: VerifyEmailDto) {
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.verifyEmail(dto.emailToken);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: !isDev(this.config),
      path: '/',
      maxAge: expiresAt.getTime() - Date.now(),
    });
    return { accessToken };
  }

  @ApiOperation({ summary: 'Login user' })
  @Post('login')
  async login(@Res({ passthrough: true }) res, @Body() dto: LoginDto) {
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.login(dto);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: !isDev(this.config),
      path: '/',
      maxAge: expiresAt.getTime() - Date.now(),
    });
    return { accessToken };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout user' })
  @Post('logout')
  async logout(@Res({ passthrough: true }) res) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'Strict',
      secure: !isDev(this.config),
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'Refresh access token by refresh cookie' })
  @Post('refresh')
  async refresh(
    @Req() req: Request & { cookies: { refreshToken?: string } },
    @Res({ passthrough: true }) res,
  ) {
    const oldToken = req.cookies.refreshToken;
    if (!oldToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.refresh(oldToken);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: !isDev(this.config),
      path: '/',
      maxAge: expiresAt.getTime() - Date.now(),
    });
    return { accessToken };
  }
}
