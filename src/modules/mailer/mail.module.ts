import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { isDev } from 'src/shared/utils/is-dev.util';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
      ): Promise<MailerOptions> => ({
        transport: {
          host: configService.getOrThrow<string>('EMAIL_HOST'),
          port: configService.getOrThrow<number>('EMAIL_PORT'),
          secure: isDev(configService),
          auth: {
            user: configService.getOrThrow<string>('EMAIL_LOGIN'),
            pass: configService.getOrThrow<string>('EMAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"Car service center" ${configService.getOrThrow<string>('EMAIL_LOGIN')}`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService, ConfigService],
  exports: [MailerModule, MailService],
})
export class MailModule {}
