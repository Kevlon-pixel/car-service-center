import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerification(
    email: string,
    link: string,
    expiry: Date,
  ): Promise<void> {
    await this.mailerService
      .sendMail({
        to: email,
        subject: 'Подтверждение почты',
        html: `Привет, вот твоя ссылка: ${link}. \nОна действительна: ${expiry}.`,
      })
      .then(() => {
        console.log('Email sent');
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
