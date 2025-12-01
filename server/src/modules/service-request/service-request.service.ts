import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestFiltersDto } from './dto/service-request-filters.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import {
  baseRequestInclude,
  RequestWithRelations,
} from './type/request-with-relations.type';
import {
  adminRequestInclude,
  RequestWithClient,
} from './type/request-with-client.type';

@Injectable()
export class ServiceRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    clientId: string,
    dto: CreateServiceRequestDto,
  ): Promise<RequestWithRelations> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.ownerId !== clientId) {
      throw new ForbiddenException(
        'You can create requests only for your vehicles',
      );
    }

    const service = dto.serviceId
      ? await this.prisma.service.findFirst({
          where: { id: dto.serviceId, isActive: true },
        })
      : null;

    if (dto.serviceId && !service) {
      throw new NotFoundException('Selected service not found');
    }

    try {
      return await this.prisma.serviceRequest.create({
        data: {
          clientId,
          vehicleId: dto.vehicleId,
          serviceId: dto.serviceId ?? null,
          desiredDate: dto.desiredDate ? new Date(dto.desiredDate) : null,
          comment: dto.comment,
        },
        include: baseRequestInclude,
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to create service request',
      );
    }
  }

  async getMyRequests(clientId: string): Promise<RequestWithRelations[]> {
    try {
      return await this.prisma.serviceRequest.findMany({
        where: { clientId },
        include: baseRequestInclude,
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to fetch service requests',
      );
    }
  }

  async getAll(
    filters: ServiceRequestFiltersDto,
  ): Promise<RequestWithClient[]> {
    const where: Prisma.ServiceRequestWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.fromDate || filters.toDate) {
      where.desiredDate = {};
      if (filters.fromDate) {
        where.desiredDate.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.desiredDate.lte = new Date(filters.toDate);
      }
    }

    try {
      return await this.prisma.serviceRequest.findMany({
        where,
        include: adminRequestInclude,
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to fetch service requests',
      );
    }
  }

  async updateStatus(
    requestId: string,
    dto: UpdateRequestStatusDto,
  ): Promise<RequestWithClient> {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    try {
      return await this.prisma.serviceRequest.update({
        where: { id: requestId },
        data: { status: dto.status },
        include: adminRequestInclude,
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to update request status');
    }
  }

  async cancelRequest(
    requestId: string,
    userId: string,
  ): Promise<RequestWithRelations> {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (request.clientId !== userId) {
      throw new ForbiddenException(
        'You can cancel only your own service requests',
      );
    }

    if (
      request.status === RequestStatus.CANCELLED ||
      request.status === RequestStatus.COMPLETED
    ) {
      throw new BadRequestException('Request cannot be cancelled');
    }

    try {
      return await this.prisma.serviceRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.CANCELLED },
        include: baseRequestInclude,
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to update request status');
    }
  }
}
