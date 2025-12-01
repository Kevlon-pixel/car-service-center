import {
  Body,
  Controller,
  Delete,
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
import { AddWorkOrderPartDto } from './dto/add-work-order-part.dto';
import { AddWorkOrderServiceDto } from './dto/add-work-order-service.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { WorkOrderFiltersDto } from './dto/work-order-filters.dto';
import { WorkOrderService } from './work-order.service';

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @ApiOperation({
    summary: 'Create work order based on service request (Admins and Workers)',
  })
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Post()
  async create(@Body() dto: CreateWorkOrderDto) {
    return this.workOrderService.createFromRequest(dto);
  }

  @ApiOperation({ summary: 'List work orders (Admins and Workers)' })
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Get()
  async getAll(@Query() filters: WorkOrderFiltersDto) {
    return this.workOrderService.getAll(filters);
  }

  @ApiOperation({ summary: 'Get my work orders (Client)' })
  @Get('my')
  async getMy(@Req() req) {
    return this.workOrderService.getMyWorkOrders(req.user.id);
  }

  @ApiOperation({ summary: 'Get work order details' })
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.workOrderService.getById(id);
  }

  @ApiOperation({
    summary: 'Update work order status (Admins and Workers)',
  })
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
  ) {
    return this.workOrderService.updateStatus(id, dto);
  }

  @ApiOperation({
    summary: 'Add service position to work order (Admins and Workers)',
  })
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Post(':id/services')
  async addService(
    @Param('id') id: string,
    @Body() dto: AddWorkOrderServiceDto,
  ) {
    return this.workOrderService.addServicePosition(id, dto);
  }

  @ApiOperation({
    summary: 'Remove service position from work order (Admins and Workers)',
  })
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Delete(':id/services/:rowId')
  async deleteService(@Param('id') id: string, @Param('rowId') rowId: string) {
    return this.workOrderService.deleteServicePosition(id, rowId);
  }

  @ApiOperation({
    summary: 'Add spare part position to work order (Admins and Workers)',
  })
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Post(':id/parts')
  async addPart(@Param('id') id: string, @Body() dto: AddWorkOrderPartDto) {
    return this.workOrderService.addPartPosition(id, dto);
  }

  @ApiOperation({
    summary: 'Remove spare part position from work order (Admins and Workers)',
  })
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Delete(':id/parts/:rowId')
  async deletePart(@Param('id') id: string, @Param('rowId') rowId: string) {
    return this.workOrderService.deletePartPosition(id, rowId);
  }
}
