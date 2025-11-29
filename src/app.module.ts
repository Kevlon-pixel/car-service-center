import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mailer/mail.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailModule,
    VehiclesModule,
  ],
  providers: [ConfigService],
})
export class AppModule {}
