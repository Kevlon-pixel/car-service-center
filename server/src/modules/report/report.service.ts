import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { FinancialReportQueryDto } from './dto/financial-report-query.dto';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinancialReport(dto: FinancialReportQueryDto) {
    const toNum = (value: unknown) => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'object' && 'toNumber' in (value as any)) {
        return Number((value as any).toNumber());
      }
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    };

    const from = new Date(dto.fromDate);
    const to = new Date(dto.toDate);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Некорректный формат дат');
    }

    if (from > to) {
      throw new BadRequestException(
        'Дата начала периода должна быть раньше или равна дате окончания',
      );
    }

    const completedOrdersWhere: Prisma.WorkOrderWhereInput = {
      status: WorkOrderStatus.COMPLETED,
      completedDate: {
        gte: from,
        lte: to,
      },
    };

    const serviceAndPartWhere: Prisma.WorkOrderServiceWhereInput['workOrder'] =
      completedOrdersWhere;

    const [revenueAgg, incomingRequests, serviceUsage, partUsage] =
      await Promise.all([
        this.prisma.workOrder.aggregate({
          where: completedOrdersWhere,
          _sum: { totalCost: true },
          _count: { _all: true },
        }),
      this.prisma.serviceRequest.count({
        where: {
          createdAt: {
            gte: from,
            lte: to,
          },
        },
      }),
      this.prisma.workOrderService.groupBy({
        by: ['serviceId'],
        where: {
          workOrder: serviceAndPartWhere,
        },
        _sum: { quantity: true, total: true },
      }),
      this.prisma.workOrderPart.groupBy({
        by: ['partId'],
        where: {
          workOrder: serviceAndPartWhere,
        },
        _sum: { quantity: true, total: true },
      }),
      ]);

    const serviceIds = serviceUsage.map((row) => row.serviceId);
    const partIds = partUsage.map((row) => row.partId);

    const [services, parts, workOrders, serviceRequests] = await Promise.all([
      serviceIds.length
        ? this.prisma.service.findMany({
            where: { id: { in: serviceIds } },
            select: {
              id: true,
              name: true,
              description: true,
              basePrice: true,
              durationMin: true,
              isActive: true,
            },
          })
        : Promise.resolve([]),
      partIds.length
        ? this.prisma.sparePart.findMany({
            where: { id: { in: partIds } },
            select: {
              id: true,
              name: true,
              article: true,
              unit: true,
              price: true,
              stockQuantity: true,
              isActive: true,
            },
          })
        : Promise.resolve([]),
      this.prisma.workOrder.findMany({
        where: completedOrdersWhere,
        select: {
          id: true,
          number: true,
          status: true,
          plannedDate: true,
          completedDate: true,
          totalLaborCost: true,
          totalPartsCost: true,
          totalCost: true,
          client: {
            select: {
              name: true,
              surname: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              make: true,
              model: true,
              year: true,
              licensePlate: true,
            },
          },
          services: {
            select: {
              quantity: true,
              total: true,
            },
          },
          parts: {
            select: {
              quantity: true,
              total: true,
            },
          },
          request: {
            select: {
              id: true,
              status: true,
              desiredDate: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.serviceRequest.findMany({
        where: {
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        select: {
          id: true,
          status: true,
          desiredDate: true,
          comment: true,
          createdAt: true,
          client: {
            select: {
              name: true,
              surname: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              make: true,
              model: true,
              year: true,
              licensePlate: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const servicesById: Record<
      string,
      {
        id: string;
        name: string;
        description: string | null;
        basePrice: number;
        durationMin: number | null;
        isActive: boolean;
      }
    > = {};
    for (const item of services) {
      servicesById[item.id] = {
        id: item.id,
        name: item.name,
        description: item.description ?? null,
        basePrice: Number(item.basePrice),
        durationMin: item.durationMin ?? null,
        isActive: item.isActive,
      };
    }

    const partsById: Record<
      string,
      {
        id: string;
        name: string;
        article: string;
        unit: string;
        price: number;
        stockQuantity: number;
        isActive: boolean;
      }
    > = {};
    for (const item of parts) {
      partsById[item.id] = {
        id: item.id,
        name: item.name,
        article: item.article,
        unit: item.unit,
        price: Number(item.price),
        stockQuantity: item.stockQuantity,
        isActive: item.isActive,
      };
    }

    const servicesReport = serviceUsage
      .map((row) => {
        const quantity = Number(row._sum.quantity ?? 0);
        const total = Number(row._sum.total ?? 0);
        const unitPrice = quantity > 0 ? total / quantity : 0;
        const service = servicesById[row.serviceId];
        return {
          id: row.serviceId,
          name: service?.name ?? 'Неизвестная услуга',
          quantity,
          unitPrice,
          total,
          service: service ?? null,
        };
      })
      .sort((a, b) => b.quantity - a.quantity);

    const partsReport = partUsage
      .map((row) => {
        const quantity = Number(row._sum.quantity ?? 0);
        const total = Number(row._sum.total ?? 0);
        const unitPrice = quantity > 0 ? total / quantity : 0;
        const part = partsById[row.partId];
        return {
          id: row.partId,
          name: part?.name ?? 'Неизвестная запчасть',
          quantity,
          unitPrice,
          total,
          part: part ?? null,
        };
      })
      .sort((a, b) => b.quantity - a.quantity);

    return {
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      revenue: Number(revenueAgg._sum.totalCost ?? 0),
      completedOrders: revenueAgg._count._all,
      incomingRequests,
      services: servicesReport,
      parts: partsReport,
      workOrdersDetailed: workOrders.map((item) => ({
        id: item.id,
        number: item.number,
        status: item.status,
        plannedDate: item.plannedDate?.toISOString() ?? null,
        completedDate: item.completedDate?.toISOString() ?? null,
        totalLaborCost: toNum(item.totalLaborCost),
        totalPartsCost: toNum(item.totalPartsCost),
        totalCost: toNum(item.totalCost),
        client: {
          name: [item.client?.surname, item.client?.name]
            .filter(Boolean)
            .join(' ')
            .trim(),
          phone: item.client?.phone ?? '',
        },
        vehicle: {
          make: item.vehicle?.make ?? '',
          model: item.vehicle?.model ?? '',
          year: item.vehicle?.year ?? null,
          licensePlate: item.vehicle?.licensePlate ?? '',
        },
        servicesCount: item.services.reduce(
          (sum, current) => sum + toNum(current.quantity),
          0,
        ),
        partsCount: item.parts.reduce(
          (sum, current) => sum + toNum(current.quantity),
          0,
        ),
        servicesTotal: item.services.reduce(
          (sum, current) => sum + toNum(current.total),
          0,
        ),
        partsTotal: item.parts.reduce(
          (sum, current) => sum + toNum(current.total),
          0,
        ),
        request: item.request
          ? {
              id: item.request.id,
              status: item.request.status,
              desiredDate: item.request.desiredDate?.toISOString() ?? null,
              createdAt: item.request.createdAt.toISOString(),
            }
          : null,
      })),
      serviceRequestsDetailed: serviceRequests.map((item) => ({
        id: item.id,
        status: item.status,
        desiredDate: item.desiredDate?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        comment: item.comment,
        client: {
          name: [item.client?.surname, item.client?.name]
            .filter(Boolean)
            .join(' ')
            .trim(),
          phone: item.client?.phone ?? '',
        },
        vehicle: {
          make: item.vehicle?.make ?? '',
          model: item.vehicle?.model ?? '',
          year: item.vehicle?.year ?? null,
          licensePlate: item.vehicle?.licensePlate ?? '',
        },
      })),
    };
  }
}
