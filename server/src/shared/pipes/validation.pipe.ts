import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata): Promise<any> {
    if (!metatype) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length) {
      const messages = errors.map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints).join(', ')
          : 'Validation error';
        return `${err.property} - ${constraints}`;
      });
      throw new BadRequestException(messages);
    }

    return object;
  }
}
