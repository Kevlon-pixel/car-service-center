import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { RolesGuard } from 'src/shared/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, RolesGuard],
})
export class VehiclesModule {}
