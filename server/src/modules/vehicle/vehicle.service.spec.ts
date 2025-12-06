import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Vehicle } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { VehicleService } from './vehicle.service';

type PrismaVehicleMock = {
  vehicle: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
};

describe('VehicleService.updateMyVehicle', () => {
  const userId = 'user-1';
  const vehicleId = 'vehicle-1';
  let prisma: PrismaVehicleMock;
  let service: VehicleService;

  const baseVehicle: Vehicle = {
    id: vehicleId,
    ownerId: userId,
    make: 'Make',
    model: 'Model',
    year: 2020,
    vin: 'VIN123',
    licensePlate: 'OLD-111',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      vehicle: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new VehicleService(prisma as unknown as PrismaService);
  });

  it('updates license plate when data is valid', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(baseVehicle);
    prisma.vehicle.findFirst.mockResolvedValue(null);
    prisma.vehicle.update.mockResolvedValue({
      ...baseVehicle,
      licensePlate: 'NEW-999',
    });

    const result = await service.updateMyVehicle(userId, vehicleId, {
      licensePlate: 'NEW-999',
    });

    expect(prisma.vehicle.findUnique).toHaveBeenCalledWith({
      where: { id: vehicleId },
    });
    expect(prisma.vehicle.findFirst).toHaveBeenCalledWith({
      where: { licensePlate: 'NEW-999', NOT: { id: vehicleId } },
    });
    expect(prisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: vehicleId },
      data: { licensePlate: 'NEW-999' },
    });
    expect(result.licensePlate).toBe('NEW-999');
  });

  it('throws when vehicle is not found', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null);

    await expect(
      service.updateMyVehicle(userId, vehicleId, { licensePlate: 'NEW-999' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when vehicle belongs to another user', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      ...baseVehicle,
      ownerId: 'other-user',
    });

    await expect(
      service.updateMyVehicle(userId, vehicleId, { licensePlate: 'NEW-999' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws conflict when license plate already exists', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(baseVehicle);
    prisma.vehicle.findFirst.mockResolvedValue({
      ...baseVehicle,
      id: 'other-vehicle',
    });

    await expect(
      service.updateMyVehicle(userId, vehicleId, { licensePlate: 'OLD-222' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.vehicle.update).not.toHaveBeenCalled();
  });

  it('throws BadRequest when licensePlate is missing in dto', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(baseVehicle);

    await expect(
      service.updateMyVehicle(userId, vehicleId, {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.vehicle.findFirst).not.toHaveBeenCalled();
    expect(prisma.vehicle.update).not.toHaveBeenCalled();
  });

  it('throws InternalServerError when update fails', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(baseVehicle);
    prisma.vehicle.findFirst.mockResolvedValue(null);
    prisma.vehicle.update.mockRejectedValue(new Error('write failed'));

    await expect(
      service.updateMyVehicle(userId, vehicleId, { licensePlate: 'NEW-999' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
