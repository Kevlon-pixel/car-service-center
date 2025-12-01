import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { SparePartService } from './spare-part.service';
import { SparePartController } from './spare-part.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SparePartController],
  providers: [SparePartService, RolesGuard],
})
export class SparePartModule {}
