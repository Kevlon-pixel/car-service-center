import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { WorkOrderService } from './work-order.service';
import { WorkOrderController } from './work-order.controller';

@Module({
  imports: [PrismaModule],
  controllers: [WorkOrderController],
  providers: [WorkOrderService, RolesGuard],
})
export class WorkOrderModule {}
