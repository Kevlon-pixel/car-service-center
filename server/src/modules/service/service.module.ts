import { Module } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { RolesGuard } from 'src/shared/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceController],
  providers: [ServiceService, RolesGuard],
})
export class ServiceModule {}
