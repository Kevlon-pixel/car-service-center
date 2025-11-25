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
import { JwtAuthGuard } from './jwt/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Регистрация пользователя' })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Подтверждение email' })
  @Post('verify')
  async verify(@Res({ passthrough: true }) res, @Body() dto: VerifyEmailDto) {
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.verifyEmail(dto.emailToken);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: expiresAt.getTime() - Date.now(),
    });
    return { accessToken };
  }

  @ApiOperation({ summary: 'Аутентификация пользователя' })
  @Post('login')
  async login(@Res({ passthrough: true }) res, @Body() dto: LoginDto) {
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.login(dto);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: expiresAt.getTime() - Date.now(),
    });
    return { accessToken };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Выход пользователя' })
  @Post('logout')
  async logout(@Res({ passthrough: true }) res) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'Strict',
      path: '/',
    });

    return { message: 'Пользователь успешно разлогинился' };
  }

  @ApiOperation({ summary: 'Обновление refresh токена' })
  @Post('refresh')
  async refresh(
    @Req() req: Request & { cookies: { refreshToken?: string } },
    @Res({ passthrough: true }) res,
  ) {
    const oldToken = req.cookies.refreshToken;
    if (!oldToken) {
      throw new UnauthorizedException('Нет refresh токена в куки');
    }
    const { accessToken, refreshToken, expiresAt } =
      await this.authService.refresh(oldToken);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: expiresAt.getTime() - Date.now(),
    });
    return { accessToken };
  }
}
