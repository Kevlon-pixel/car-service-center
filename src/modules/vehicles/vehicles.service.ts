import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Vehicle } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AddVehicleDto } from './dto/add-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyVehicles(userId: string): Promise<Vehicle[]> {
    try {
      return await this.prisma.vehicle.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch vehicles');
    }
  }

  async addMyVehicle(userId: string, dto: AddVehicleDto): Promise<Vehicle> {
    try {
      return await this.prisma.vehicle.create({
        data: {
          ownerId: userId,
          make: dto.make,
          model: dto.model,
          year: dto.year,
          vin: dto.vin,
          licensePlate: dto.licensePlate,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Vehicle with this license plate already exists');
      }
      throw new InternalServerErrorException('Failed to create vehicle');
    }
  }

  async updateMyVehicle(
    userId: string,
    vehicleId: string,
    dto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this vehicle');
    }

    if (dto.licensePlate) {
      const existing = await this.prisma.vehicle.findFirst({
        where: {
          licensePlate: dto.licensePlate,
          NOT: { id: vehicleId },
        },
      });

      if (existing) {
        throw new ConflictException('Vehicle with this license plate already exists');
      }
    }

    try {
      return await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          licensePlate: dto.licensePlate ?? vehicle.licensePlate,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to update vehicle');
    }
  }

  async deleteMyVehicle(userId: string, vehicleId: string): Promise<void> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this vehicle');
    }

    try {
      await this.prisma.vehicle.delete({
        where: { id: vehicleId },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to delete vehicle');
    }
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    try {
      return await this.prisma.vehicle.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch vehicles');
    }
  }

  async getVehicleById(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }
}
