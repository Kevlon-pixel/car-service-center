import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportController],
  providers: [ReportService, RolesGuard],
})
export class ReportModule {}
