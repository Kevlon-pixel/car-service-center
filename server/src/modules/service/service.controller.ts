import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceService } from './service.service';

@Controller('services')
export class ServiceController {
  constructor(private readonly servicesService: ServiceService) {}

  @ApiOperation({ summary: 'Get available services (public)' })
  @Get()
  async getServices(
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const showInactive = includeInactive === 'true';
    return this.servicesService.getAvailableServices(search, showInactive);
  }

  @ApiOperation({ summary: 'Create service (Admin and Worker)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Post()
  async createService(@Body() dto: CreateServiceDto) {
    return this.servicesService.createService(dto);
  }

  @ApiOperation({ summary: 'Update service (Admin and Worker)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Patch(':id')
  async updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.updateService(id, dto);
  }

  @ApiOperation({ summary: 'Delete service (Admin and Worker)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Delete(':id')
  async deleteService(@Param('id') id: string) {
    return this.servicesService.deleteService(id);
  }
}
