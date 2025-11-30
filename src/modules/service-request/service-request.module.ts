import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { ServiceRequestController } from './service-request.controller';
import { ServiceRequestService } from './service-request.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService, RolesGuard],
})
export class ServiceRequestModule {}
