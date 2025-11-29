import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RolesGuard } from 'src/shared/guards/roles.guard';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [UserController],
  providers: [UserService, RolesGuard],
  exports: [UserService],
})
export class UserModule {}
