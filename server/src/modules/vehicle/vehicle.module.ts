import { Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { RolesGuard } from 'src/shared/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [VehicleController],
  providers: [VehicleService, RolesGuard],
})
export class VehicleModule {}
