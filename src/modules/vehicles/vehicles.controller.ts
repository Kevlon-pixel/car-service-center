import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { SystemRole } from '@prisma/client';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AddVehicleDto } from './dto/add-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @ApiOperation({ summary: 'Get user vehicles (List of client vehicles)' })
  @Get('my')
  async getMyVehicles(@Req() req) {
    return this.vehiclesService.getMyVehicles(req.user.id);
  }

  @ApiOperation({ summary: 'Add new user vehicle (For clients)' })
  @Post()
  async addMyVehicle(@Req() req, @Body() dto: AddVehicleDto) {
    return this.vehiclesService.addMyVehicle(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Update user vehicle (Only vehicle owner)' })
  @Patch(':id')
  async updateMyVehicle(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.updateMyVehicle(req.user.id, id, dto);
  }

  @ApiOperation({ summary: 'Delete user vehicle (Only vehicle owner)' })
  @Delete(':id')
  async deleteMyVehicle(@Req() req, @Param('id') id: string) {
    return this.vehiclesService.deleteMyVehicle(req.user.id, id);
  }

  @ApiOperation({ summary: 'Get vehicle by id (Admin and Worker only)' })
  @UseGuards( RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Get(':id')
  async getVehicleById(@Param('id') id: string) {
    return this.vehiclesService.getVehicleById(id);
  }

  @ApiOperation({ summary: 'Get all vehicles (Admin and Worker only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Get()
  async getAllVehicles() {
    return this.vehiclesService.getAllVehicles();
  }
}
