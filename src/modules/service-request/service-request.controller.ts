import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestFiltersDto } from './dto/service-request-filters.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { ServiceRequestService } from './service-request.service';

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('service-requests')
export class ServiceRequestController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @ApiOperation({
    summary: 'Create a new service request (client vehicles only)',
  })
  @Post()
  async createRequest(@Req() req, @Body() dto: CreateServiceRequestDto) {
    return this.serviceRequestService.create(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Get current client service requests' })
  @Get('my')
  async getMyRequests(@Req() req) {
    return this.serviceRequestService.getMyRequests(req.user.id);
  }

  @ApiOperation({ summary: 'Get all service requests (Admin and Worker)' })
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Get()
  async getAll(@Query() filters: ServiceRequestFiltersDto) {
    return this.serviceRequestService.getAll(filters);
  }

  @ApiOperation({
    summary: 'Update request status (Admins and Workers)',
  })
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    return this.serviceRequestService.updateStatus(id, dto);
  }

  @ApiOperation({
    summary: 'Cancel request (Clients cancel own request)',
  })
  @Patch(':id/cancel')
  async cancelRequest(@Param('id') id: string, @Req() req) {
    return this.serviceRequestService.cancelRequest(id, req.user.id);
  }
}
