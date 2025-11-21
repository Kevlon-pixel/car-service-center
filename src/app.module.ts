import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
  providers: [AppService, ConfigService],
})
export class AppModule {}
