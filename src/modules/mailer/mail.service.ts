import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerification(
    email: string,
    link: string,
    expiry: Date,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Email verification',
        html: `Please confirm your email by following the link: ${link}.<br/>This link will expire at: ${expiry.toLocaleString(
          'ru-RU',
          {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          },
        )}.`,
      });
    } catch (err) {
      this.logger.error('Failed to send verification email', err as Error);
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }
}
