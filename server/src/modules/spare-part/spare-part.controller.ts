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
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { SparePartService } from './spare-part.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

@Controller('spare-parts')
export class SparePartController {
  constructor(private readonly sparePartService: SparePartService) {}

  @ApiOperation({
    summary: 'Get available spare parts (filter by name or article)',
  })
  @Get()
  async getSpareParts(
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const showInactive = includeInactive === 'true';
    return this.sparePartService.getSpareParts(search, showInactive);
  }

  @ApiOperation({ summary: 'Create spare part (Admin and Worker)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Post()
  async createSparePart(@Body() dto: CreateSparePartDto) {
    return this.sparePartService.createSparePart(dto);
  }

  @ApiOperation({ summary: 'Update spare part (Admin and Worker)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Patch(':id')
  async updateSparePart(
    @Param('id') id: string,
    @Body() dto: UpdateSparePartDto,
  ) {
    return this.sparePartService.updateSparePart(id, dto);
  }

  @ApiOperation({ summary: 'Delete spare part (Admin and Worker)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.WORKER)
  @Delete(':id')
  async deleteSparePart(@Param('id') id: string) {
    return this.sparePartService.deleteSparePart(id);
  }
}
