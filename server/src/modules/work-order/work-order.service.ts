import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RequestStatus,
  SystemRole,
  WorkOrderStatus,
} from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import {
  WorkOrderWithRelations,
  workOrderInclude,
} from './type/work-order-with-relations.type';
import { WorkOrderFiltersDto } from './dto/work-order-filters.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { AddWorkOrderServiceDto } from './dto/add-work-order-service.dto';
import { AddWorkOrderPartDto } from './dto/add-work-order-part.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';

@Injectable()
export class WorkOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromRequest(
    dto: CreateWorkOrderDto,
  ): Promise<WorkOrderWithRelations> {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: dto.requestId },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (request.status === RequestStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot create work order from cancelled request',
      );
    }

    const existingOrder = await this.prisma.workOrder.findUnique({
      where: { requestId: dto.requestId },
    });

    if (existingOrder) {
      throw new BadRequestException(
        'Work order already exists for this request',
      );
    }

    if (dto.responsibleWorkerId) {
      const worker = await this.prisma.user.findUnique({
        where: { id: dto.responsibleWorkerId },
      });

      if (!worker) {
        throw new NotFoundException('Responsible worker does not exist');
      }

      if (
        worker.role !== SystemRole.ADMIN &&
        worker.role !== SystemRole.WORKER
      ) {
        throw new BadRequestException(
          'Responsible worker must be an Admin or Worker',
        );
      }
    }

    const plannedDate =
      dto.plannedDate !== undefined
        ? dto.plannedDate
          ? this.parseLocalDateTime(dto.plannedDate)
          : null
        : (request.desiredDate ?? null);

    const number = await this.generateWorkOrderNumber();

    try {
      return await this.prisma.workOrder.create({
        data: {
          number,
          clientId: request.clientId,
          vehicleId: request.vehicleId,
          requestId: request.id,
          plannedDate,
          responsibleWorkerId: dto.responsibleWorkerId,
        },
        include: workOrderInclude,
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to create work order');
    }
  }

  async getAll(
    filters: WorkOrderFiltersDto,
  ): Promise<WorkOrderWithRelations[]> {
    const where: Prisma.WorkOrderWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }

    if (filters.responsibleWorkerId) {
      where.responsibleWorkerId = filters.responsibleWorkerId;
    }

    try {
      return await this.prisma.workOrder.findMany({
        where,
        include: workOrderInclude,
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch work orders');
    }
  }

  async getMyWorkOrders(clientId: string): Promise<WorkOrderWithRelations[]> {
    try {
      return await this.prisma.workOrder.findMany({
        where: { clientId },
        include: workOrderInclude,
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch work orders');
    }
  }

  async getClientRelatedWorkOrders(
    clientId: string,
  ): Promise<WorkOrderWithRelations[]> {
    try {
      return await this.prisma.workOrder.findMany({
        where: {
          OR: [{ clientId }, { request: { clientId } }],
        },
        include: workOrderInclude,
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to fetch client work orders',
      );
    }
  }

  async getById(id: string): Promise<WorkOrderWithRelations> {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: workOrderInclude,
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    return workOrder;
  }

  async updateStatus(
    id: string,
    dto: UpdateWorkOrderStatusDto,
  ): Promise<WorkOrderWithRelations> {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    const data: Prisma.WorkOrderUpdateInput = { status: dto.status };

    if (dto.status === WorkOrderStatus.COMPLETED) {
      data.completedDate = new Date();
    }

    try {
      return await this.prisma.workOrder.update({
        where: { id },
        data,
        include: workOrderInclude,
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to update work order');
    }
  }

  async updateWorkOrder(
    id: string,
    dto: UpdateWorkOrderDto,
  ): Promise<WorkOrderWithRelations> {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    const hasEditableChanges =
      dto.plannedDate !== undefined ||
      dto.responsibleWorkerId !== undefined ||
      dto.services !== undefined ||
      dto.parts !== undefined;

    if (
      hasEditableChanges &&
      (workOrder.status === WorkOrderStatus.COMPLETED ||
        workOrder.status === WorkOrderStatus.CANCELLED)
    ) {
      throw new BadRequestException('Work order is not editable');
    }

    if (dto.responsibleWorkerId) {
      const worker = await this.prisma.user.findUnique({
        where: { id: dto.responsibleWorkerId },
      });

      if (!worker) {
        throw new NotFoundException('Responsible worker does not exist');
      }

      if (
        worker.role !== SystemRole.ADMIN &&
        worker.role !== SystemRole.WORKER
      ) {
        throw new BadRequestException(
          'Responsible worker must be an Admin or Worker',
        );
      }
    }

    const serviceInputs = dto.services ?? null;
    const partInputs = dto.parts ?? null;

    const servicePrices =
      serviceInputs && serviceInputs.length > 0
        ? await this.getServicePricesMap(serviceInputs.map((item) => item.serviceId))
        : null;

    const partPrices =
      partInputs && partInputs.length > 0
        ? await this.getPartPricesMap(partInputs.map((item) => item.partId))
        : null;

    const workOrderUpdate: Prisma.WorkOrderUncheckedUpdateInput = {};

    if (dto.plannedDate !== undefined) {
      workOrderUpdate.plannedDate =
        dto.plannedDate === null || dto.plannedDate === ''
          ? null
          : this.parseLocalDateTime(dto.plannedDate);
    }

    if (dto.responsibleWorkerId !== undefined) {
      workOrderUpdate.responsibleWorkerId =
        dto.responsibleWorkerId === null || dto.responsibleWorkerId === ''
          ? null
          : dto.responsibleWorkerId;
    }

    if (dto.status !== undefined) {
      workOrderUpdate.status = dto.status;

      if (dto.status === WorkOrderStatus.COMPLETED) {
        workOrderUpdate.completedDate = new Date();
      }
    }

    const hasChanges =
      Object.keys(workOrderUpdate).length > 0 ||
      serviceInputs !== null ||
      partInputs !== null;

    if (!hasChanges) {
      throw new BadRequestException('No fields to update');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (serviceInputs !== null) {
          await tx.workOrderService.deleteMany({ where: { workOrderId: id } });

          if (serviceInputs.length > 0 && servicePrices) {
            await tx.workOrderService.createMany({
              data: serviceInputs.map((input) => {
                const price = servicePrices[input.serviceId];
                const quantity = input.quantity ?? 1;
                return {
                  workOrderId: id,
                  serviceId: input.serviceId,
                  quantity,
                  price,
                  total: price.mul(quantity),
                };
              }),
            });
          }
        }

        if (partInputs !== null) {
          await tx.workOrderPart.deleteMany({ where: { workOrderId: id } });

          if (partInputs.length > 0 && partPrices) {
            await tx.workOrderPart.createMany({
              data: partInputs.map((input) => {
                const price = partPrices[input.partId];
                const quantity = input.quantity ?? 1;
                return {
                  workOrderId: id,
                  partId: input.partId,
                  quantity,
                  price,
                  total: price.mul(quantity),
                };
              }),
            });
          }
        }

        if (serviceInputs !== null || partInputs !== null) {
          const totals = await this.calculateTotals(id, tx);
          workOrderUpdate.totalLaborCost = totals.totalLaborCost;
          workOrderUpdate.totalPartsCost = totals.totalPartsCost;
          workOrderUpdate.totalCost = totals.totalCost;
        }

        return tx.workOrder.update({
          where: { id },
          data: workOrderUpdate,
          include: workOrderInclude,
        });
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to update work order details',
      );
    }
  }

  async addServicePosition(
    workOrderId: string,
    dto: AddWorkOrderServiceDto,
  ): Promise<WorkOrderWithRelations> {
    await this.ensureEditable(workOrderId);

    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, isActive: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const quantity = dto.quantity ?? 1;
    const price = new Prisma.Decimal(service.basePrice);
    const total = price.mul(quantity);

    try {
      await this.prisma.workOrderService.create({
        data: {
          workOrderId,
          serviceId: service.id,
          quantity,
          price,
          total,
        },
      });

      return await this.recalculateTotals(workOrderId);
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to add service to work order',
      );
    }
  }

  async deleteServicePosition(
    workOrderId: string,
    rowId: string,
  ): Promise<WorkOrderWithRelations> {
    await this.ensureEditable(workOrderId);

    const row = await this.prisma.workOrderService.findUnique({
      where: { id: rowId },
    });

    if (!row || row.workOrderId !== workOrderId) {
      throw new NotFoundException('Work order service position not found');
    }

    try {
      await this.prisma.workOrderService.delete({ where: { id: rowId } });
      return await this.recalculateTotals(workOrderId);
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to delete service from work order',
      );
    }
  }

  async addPartPosition(
    workOrderId: string,
    dto: AddWorkOrderPartDto,
  ): Promise<WorkOrderWithRelations> {
    await this.ensureEditable(workOrderId);

    const part = await this.prisma.sparePart.findFirst({
      where: { id: dto.partId, isActive: true },
    });

    if (!part) {
      throw new NotFoundException('Spare part not found');
    }

    const quantity = dto.quantity ?? 1;
    const price = new Prisma.Decimal(part.price);
    const total = price.mul(quantity);

    try {
      await this.prisma.workOrderPart.create({
        data: {
          workOrderId,
          partId: part.id,
          quantity,
          price,
          total,
        },
      });

      return await this.recalculateTotals(workOrderId);
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to add part to work order',
      );
    }
  }

  async deletePartPosition(
    workOrderId: string,
    rowId: string,
  ): Promise<WorkOrderWithRelations> {
    await this.ensureEditable(workOrderId);

    const row = await this.prisma.workOrderPart.findUnique({
      where: { id: rowId },
    });

    if (!row || row.workOrderId !== workOrderId) {
      throw new NotFoundException('Work order part position not found');
    }

    try {
      await this.prisma.workOrderPart.delete({ where: { id: rowId } });
      return await this.recalculateTotals(workOrderId);
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to delete part from work order',
      );
    }
  }

  private async getServicePricesMap(serviceIds: string[]) {
    const uniqueIds = Array.from(new Set(serviceIds));
    const services = await this.prisma.service.findMany({
      where: { id: { in: uniqueIds }, isActive: true },
    });

    if (services.length !== uniqueIds.length) {
      throw new NotFoundException('One or more services not found');
    }

    return services.reduce<Record<string, Prisma.Decimal>>((acc, service) => {
      acc[service.id] = new Prisma.Decimal(service.basePrice);
      return acc;
    }, {});
  }

  private async getPartPricesMap(partIds: string[]) {
    const uniqueIds = Array.from(new Set(partIds));
    const parts = await this.prisma.sparePart.findMany({
      where: { id: { in: uniqueIds }, isActive: true },
    });

    if (parts.length !== uniqueIds.length) {
      throw new NotFoundException('One or more spare parts not found');
    }

    return parts.reduce<Record<string, Prisma.Decimal>>((acc, part) => {
      acc[part.id] = new Prisma.Decimal(part.price);
      return acc;
    }, {});
  }

  private async calculateTotals(
    workOrderId: string,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const [services, parts] = await Promise.all([
      prismaClient.workOrderService.findMany({ where: { workOrderId } }),
      prismaClient.workOrderPart.findMany({ where: { workOrderId } }),
    ]);

    const totalLaborCost = services.reduce(
      (sum, row) => sum.plus(row.total),
      new Prisma.Decimal(0),
    );

    const totalPartsCost = parts.reduce(
      (sum, row) => sum.plus(row.total),
      new Prisma.Decimal(0),
    );

    const totalCost = totalLaborCost.plus(totalPartsCost);

    return { totalLaborCost, totalPartsCost, totalCost };
  }

  private async recalculateTotals(
    workOrderId: string,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<WorkOrderWithRelations> {
    try {
      const totals = await this.calculateTotals(workOrderId, prismaClient);

      return await prismaClient.workOrder.update({
        where: { id: workOrderId },
        data: totals,
        include: workOrderInclude,
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to recalculate work order totals',
      );
    }
  }

  private async ensureEditable(workOrderId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    if (
      workOrder.status === WorkOrderStatus.COMPLETED ||
      workOrder.status === WorkOrderStatus.CANCELLED
    ) {
      throw new BadRequestException('Work order is not editable');
    }
  }

  private parseLocalDateTime(input: string) {
    // Preserve wall-time entered in datetime-local control (no TZ info)
    return new Date(`${input}Z`);
  }

  private async generateWorkOrderNumber(): Promise<string> {
    const count = await this.prisma.workOrder.count();
    const nextNumber = (count + 1).toString().padStart(6, '0');
    return `WO-${nextNumber}`;
  }
}
