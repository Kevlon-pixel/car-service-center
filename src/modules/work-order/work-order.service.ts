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
        ? new Date(dto.plannedDate)
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

  private async recalculateTotals(
    workOrderId: string,
  ): Promise<WorkOrderWithRelations> {
    const [services, parts] = await Promise.all([
      this.prisma.workOrderService.findMany({ where: { workOrderId } }),
      this.prisma.workOrderPart.findMany({ where: { workOrderId } }),
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

    try {
      return await this.prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
          totalLaborCost,
          totalPartsCost,
          totalCost,
        },
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

  private async generateWorkOrderNumber(): Promise<string> {
    const count = await this.prisma.workOrder.count();
    const nextNumber = (count + 1).toString().padStart(6, '0');
    return `WO-${nextNumber}`;
  }
}
