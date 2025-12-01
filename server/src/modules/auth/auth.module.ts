import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { MailModule } from '../mailer/mail.module';
import { JwtAccessStrategy } from './jwt/strategies/jwt-strategy';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Module({
  imports: [
    UserModule,
    ConfigModule,
    PrismaModule,
    MailModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtAuthGuard],
})
export class AuthModule {}
