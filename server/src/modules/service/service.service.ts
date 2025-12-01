import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Service } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableServices(): Promise<Service[]> {
    try {
      return await this.prisma.service.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch services');
    }
  }

  async createService(dto: CreateServiceDto): Promise<Service> {
    try {
      return await this.prisma.service.create({
        data: {
          name: dto.name,
          description: dto.description,
          basePrice: new Prisma.Decimal(dto.basePrice),
          durationMin: dto.durationMin,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to create service');
    }
  }

  async updateService(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const data: Prisma.ServiceUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.basePrice !== undefined) {
      data.basePrice = new Prisma.Decimal(dto.basePrice);
    }
    if (dto.durationMin !== undefined) {
      data.durationMin = dto.durationMin;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }

    try {
      return await this.prisma.service.update({
        where: { id },
        data,
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to update service');
    }
  }

  async deleteService(id: string): Promise<void> {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    try {
      await this.prisma.service.delete({
        where: { id },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to delete service');
    }
  }
}
