import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mailer/mail.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { ServiceModule } from './modules/service/service.module';
import { SparePartModule } from './modules/spare-part/spare-part.module';
import { ServiceRequestModule } from './modules/service-request/service-request.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailModule,
    VehicleModule,
    ServiceModule,
    SparePartModule,
    ServiceRequestModule,
  ],
  providers: [ConfigService],
})
export class AppModule {}
