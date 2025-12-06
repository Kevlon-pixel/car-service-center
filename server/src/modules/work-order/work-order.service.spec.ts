import { InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { WorkOrderService } from './work-order.service';
import { workOrderInclude } from './type/work-order-with-relations.type';

type PrismaMock = {
  workOrderService: { findMany: jest.Mock; create: jest.Mock };
  workOrderPart: { findMany: jest.Mock; create: jest.Mock };
  workOrder: { update: jest.Mock; findUnique: jest.Mock; count: jest.Mock };
  service: { findFirst: jest.Mock };
  sparePart: { findFirst: jest.Mock };
};

describe('WorkOrderService.recalculateTotals', () => {
  const workOrderId = 'work-order-id';
  let prisma: PrismaMock;
  let service: WorkOrderService;

  const toDecimal = (value: string | number) => new Prisma.Decimal(value);

  const setupTotals = (
    serviceTotals: Array<string | number>,
    partTotals: Array<string | number>,
    overrides: Record<string, unknown> = {},
  ) => {
    const services = serviceTotals.map((total) => ({ total: toDecimal(total) }));
    const parts = partTotals.map((total) => ({ total: toDecimal(total) }));

    prisma.workOrderService.findMany.mockResolvedValue(services);
    prisma.workOrderPart.findMany.mockResolvedValue(parts);

    const totalLaborCost = services.reduce(
      (sum, row) => sum.plus(row.total),
      new Prisma.Decimal(0),
    );
    const totalPartsCost = parts.reduce(
      (sum, row) => sum.plus(row.total),
      new Prisma.Decimal(0),
    );
    const totalCost = totalLaborCost.plus(totalPartsCost);

    const updatedWorkOrder = {
      id: workOrderId,
      totalLaborCost,
      totalPartsCost,
      totalCost,
      ...overrides,
    };

    prisma.workOrder.update.mockResolvedValue(updatedWorkOrder);

    return { totalLaborCost, totalPartsCost, totalCost, updatedWorkOrder };
  };

  beforeEach(() => {
    prisma = {
      workOrderService: { findMany: jest.fn(), create: jest.fn() },
      workOrderPart: { findMany: jest.fn(), create: jest.fn() },
      workOrder: { update: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
      service: { findFirst: jest.fn() },
      sparePart: { findFirst: jest.fn() },
    };

    prisma.workOrderService.findMany.mockResolvedValue([]);
    prisma.workOrderPart.findMany.mockResolvedValue([]);
    prisma.workOrder.findUnique.mockResolvedValue({ id: workOrderId });

    service = new WorkOrderService(prisma as unknown as PrismaService);
  });

  const recalc = () => (service as any).recalculateTotals(workOrderId);

  it('calculates totals with one service and one part', async () => {
    const expected = setupTotals([100], [50]);

    const result = await recalc();

    expect(prisma.workOrder.update).toHaveBeenCalledWith({
      where: { id: workOrderId },
      data: {
        totalLaborCost: expected.totalLaborCost,
        totalPartsCost: expected.totalPartsCost,
        totalCost: expected.totalCost,
      },
      include: workOrderInclude,
    });
    expect(result).toEqual(expected.updatedWorkOrder);
  });

  it('calculates totals with multiple services and parts', async () => {
    const expected = setupTotals([100, 250.5, 49.5], [10, 20]);

    await recalc();

    const updateData = prisma.workOrder.update.mock.calls[0][0].data;
    expect(updateData.totalLaborCost.toNumber()).toBe(400);
    expect(updateData.totalPartsCost.toNumber()).toBe(30);
    expect(updateData.totalCost.toNumber()).toBe(430);
  });

  it('handles recalculation when there are no services', async () => {
    const expected = setupTotals([], [80]);

    await recalc();

    const updateData = prisma.workOrder.update.mock.calls[0][0].data;
    expect(updateData.totalLaborCost.toNumber()).toBe(0);
    expect(updateData.totalPartsCost.toNumber()).toBe(80);
    expect(updateData.totalCost.toNumber()).toBe(80);
    expect(prisma.workOrder.update).toHaveBeenCalledWith({
      where: { id: workOrderId },
      data: {
        totalLaborCost: expected.totalLaborCost,
        totalPartsCost: expected.totalPartsCost,
        totalCost: expected.totalCost,
      },
      include: workOrderInclude,
    });
  });

  it('handles recalculation when there are no parts', async () => {
    const expected = setupTotals([120], []);

    await recalc();

    const updateData = prisma.workOrder.update.mock.calls[0][0].data;
    expect(updateData.totalLaborCost.toNumber()).toBe(120);
    expect(updateData.totalPartsCost.toNumber()).toBe(0);
    expect(updateData.totalCost.toNumber()).toBe(120);
    expect(prisma.workOrder.update).toHaveBeenCalledWith({
      where: { id: workOrderId },
      data: {
        totalLaborCost: expected.totalLaborCost,
        totalPartsCost: expected.totalPartsCost,
        totalCost: expected.totalCost,
      },
      include: workOrderInclude,
    });
  });

  it('handles recalculation when there are no services or parts', async () => {
    setupTotals([], []);

    await recalc();

    const updateData = prisma.workOrder.update.mock.calls[0][0].data;
    expect(updateData.totalLaborCost.toNumber()).toBe(0);
    expect(updateData.totalPartsCost.toNumber()).toBe(0);
    expect(updateData.totalCost.toNumber()).toBe(0);
  });

  it('preserves decimal precision with large values', async () => {
    setupTotals(
      ['123456789.12345', '0.87655'],
      ['987654321.98765', '0.01235'],
    );

    await recalc();

    const updateData = prisma.workOrder.update.mock.calls[0][0].data;
    expect(updateData.totalLaborCost.toString()).toBe('123456790');
    expect(updateData.totalPartsCost.toString()).toBe('987654322');
    expect(updateData.totalCost.toString()).toBe('1111111112');
  });

  it('keeps totalLaborCost and totalPartsCost separated before summing', async () => {
    const expected = setupTotals([10, 20], [5, 5]);

    await recalc();

    const updateData = prisma.workOrder.update.mock.calls[0][0].data;
    expect(updateData.totalLaborCost.toNumber()).toBe(30);
    expect(updateData.totalPartsCost.toNumber()).toBe(10);
    expect(updateData.totalCost.toNumber()).toBe(40);
    expect(updateData.totalCost.equals(expected.totalLaborCost.plus(expected.totalPartsCost))).toBe(
      true,
    );
  });

  it('builds totalCost as the sum of labor and parts', async () => {
    setupTotals([15.75], [9.25]);

    await recalc();

    const updateData = prisma.workOrder.update.mock.calls[0][0].data;
    expect(updateData.totalLaborCost.plus(updateData.totalPartsCost).toNumber()).toBe(
      updateData.totalCost.toNumber(),
    );
  });

  it('throws an exception when work order update fails', async () => {
    prisma.workOrder.update.mockRejectedValue(new Error('DB error'));

    await expect(recalc()).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(prisma.workOrder.update).toHaveBeenCalledTimes(1);
  });

  it('throws an exception when work order does not exist', async () => {
    prisma.workOrder.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.17.1',
      }),
    );

    await expect(recalc()).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(prisma.workOrderService.findMany).toHaveBeenCalledWith({
      where: { workOrderId },
    });
    expect(prisma.workOrderPart.findMany).toHaveBeenCalledWith({
      where: { workOrderId },
    });
  });
});

describe('WorkOrderService.addPartPosition', () => {
  const workOrderId = 'wo-1';
  const partId = 'part-1';
  let prisma: PrismaMock;
  let service: WorkOrderService;
  let recalcSpy: jest.SpyInstance;
  let ensureEditableSpy: jest.SpyInstance;

  const decimal = (value: number | string) => new Prisma.Decimal(value);

  beforeEach(() => {
    prisma = {
      workOrderService: { findMany: jest.fn(), create: jest.fn() },
      workOrderPart: { findMany: jest.fn(), create: jest.fn() },
      workOrder: {
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ id: workOrderId }),
        count: jest.fn(),
      },
      service: { findFirst: jest.fn() },
      sparePart: { findFirst: jest.fn() },
    };

    service = new WorkOrderService(prisma as unknown as PrismaService);
    recalcSpy = jest
      .spyOn(service as any, 'recalculateTotals')
      .mockResolvedValue({ id: workOrderId, totalCost: decimal(200) });
    ensureEditableSpy = jest
      .spyOn(service as any, 'ensureEditable')
      .mockResolvedValue(undefined);
  });

  const dto = (quantity?: number) => ({ partId, quantity });

  it('adds part with valid data', async () => {
    prisma.sparePart.findFirst.mockResolvedValue({
      id: partId,
      price: decimal(100),
      isActive: true,
    });
    prisma.workOrderPart.create.mockResolvedValue({ id: 'row-1' });

    const result = await service.addPartPosition(workOrderId, dto(2));

    expect(ensureEditableSpy).toHaveBeenCalledWith(workOrderId);
    const createCall = prisma.workOrderPart.create.mock.calls[0][0].data;
    expect(createCall).toMatchObject({
      workOrderId,
      partId,
      quantity: 2,
    });
    expect(createCall.price.equals(decimal(100))).toBe(true);
    expect(createCall.total.equals(decimal(200))).toBe(true);
    expect(recalcSpy).toHaveBeenCalledWith(workOrderId);
    expect(result).toEqual({ id: workOrderId, totalCost: decimal(200) });
  });

  it('defaults quantity to 1 when omitted', async () => {
    prisma.sparePart.findFirst.mockResolvedValue({
      id: partId,
      price: decimal(50),
      isActive: true,
    });

    await service.addPartPosition(workOrderId, dto());

    const createCall = prisma.workOrderPart.create.mock.calls[0][0].data;
    expect(createCall.quantity).toBe(1);
    expect(createCall.total.equals(decimal(50))).toBe(true);
  });

  it('calculates price and total correctly', async () => {
    prisma.sparePart.findFirst.mockResolvedValue({
      id: partId,
      price: decimal('19.99'),
      isActive: true,
    });

    await service.addPartPosition(workOrderId, dto(3));

    const createCall = prisma.workOrderPart.create.mock.calls[0][0].data;
    expect(createCall.price.toString()).toBe('19.99');
    expect(createCall.total.toString()).toBe('59.97');
  });

  it('throws when part is not found or inactive', async () => {
    prisma.sparePart.findFirst.mockResolvedValue(null);

    await expect(service.addPartPosition(workOrderId, dto(1))).rejects.toThrow(
      'Spare part not found',
    );
    expect(prisma.workOrderPart.create).not.toHaveBeenCalled();
  });

  it('throws when quantity is invalid (db rejects)', async () => {
    prisma.sparePart.findFirst.mockResolvedValue({
      id: partId,
      price: decimal(10),
      isActive: true,
    });
    prisma.workOrderPart.create.mockRejectedValue(new Error('Invalid qty'));

    await expect(service.addPartPosition(workOrderId, dto(-1))).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('throws when persisting part fails', async () => {
    prisma.sparePart.findFirst.mockResolvedValue({
      id: partId,
      price: decimal(10),
      isActive: true,
    });
    prisma.workOrderPart.create.mockRejectedValue(new Error('DB down'));

    await expect(service.addPartPosition(workOrderId, dto(1))).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});

describe('WorkOrderService.generateWorkOrderNumber', () => {
  let prisma: PrismaMock;
  let service: WorkOrderService;

  beforeEach(() => {
    prisma = {
      workOrderService: { findMany: jest.fn(), create: jest.fn() },
      workOrderPart: { findMany: jest.fn(), create: jest.fn() },
      workOrder: {
        update: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      service: { findFirst: jest.fn() },
      sparePart: { findFirst: jest.fn() },
    };
    service = new WorkOrderService(prisma as unknown as PrismaService);
  });

  const generate = () => (service as any).generateWorkOrderNumber();

  it('returns WO- prefix with zero padding when count is 0', async () => {
    prisma.workOrder.count.mockResolvedValue(0);

    await expect(generate()).resolves.toBe('WO-000001');
  });

  it('pads numbers correctly for single digits', async () => {
    prisma.workOrder.count.mockResolvedValue(5);

    await expect(generate()).resolves.toBe('WO-000006');
  });

  it('handles boundary at 999999', async () => {
    prisma.workOrder.count.mockResolvedValue(999999);

    await expect(generate()).resolves.toBe('WO-1000000');
  });

  it('handles large count values', async () => {
    prisma.workOrder.count.mockResolvedValue(12345678);

    await expect(generate()).resolves.toBe('WO-12345679');
  });

  it('produces unique sequential numbers across calls', async () => {
    prisma.workOrder.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    const first = await generate();
    const second = await generate();
    const third = await generate();

    expect(first).toBe('WO-000001');
    expect(second).toBe('WO-000002');
    expect(third).toBe('WO-000003');
  });

  it('propagates errors when count fails', async () => {
    prisma.workOrder.count.mockRejectedValue(new Error('count failed'));

    await expect(generate()).rejects.toThrow('count failed');
  });
});

describe('WorkOrderService.addServicePosition', () => {
  const workOrderId = 'wo-2';
  const serviceId = 'service-1';
  let prisma: PrismaMock;
  let serviceInstance: WorkOrderService;
  let recalcSpy: jest.SpyInstance;
  let ensureEditableSpy: jest.SpyInstance;

  const decimal = (value: number | string) => new Prisma.Decimal(value);

  beforeEach(() => {
    prisma = {
      workOrderService: { findMany: jest.fn(), create: jest.fn() },
      workOrderPart: { findMany: jest.fn(), create: jest.fn() },
      workOrder: {
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ id: workOrderId }),
        count: jest.fn(),
      },
      service: { findFirst: jest.fn() },
      sparePart: { findFirst: jest.fn() },
    };
    serviceInstance = new WorkOrderService(prisma as unknown as PrismaService);
    recalcSpy = jest
      .spyOn(serviceInstance as any, 'recalculateTotals')
      .mockResolvedValue({ id: workOrderId, totalCost: decimal(60) });
    ensureEditableSpy = jest
      .spyOn(serviceInstance as any, 'ensureEditable')
      .mockResolvedValue(undefined);
  });

  const dto = (quantity?: number) => ({ serviceId, quantity });

  it('adds service with valid data', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: serviceId,
      basePrice: decimal(30),
      isActive: true,
    });

    await serviceInstance.addServicePosition(workOrderId, dto(2));

    expect(ensureEditableSpy).toHaveBeenCalledWith(workOrderId);
    const createCall = prisma.workOrderService.create.mock.calls[0][0].data;
    expect(createCall).toMatchObject({
      workOrderId,
      serviceId,
      quantity: 2,
    });
    expect(createCall.price.equals(decimal(30))).toBe(true);
    expect(createCall.total.equals(decimal(60))).toBe(true);
    expect(recalcSpy).toHaveBeenCalledWith(workOrderId);
  });

  it('defaults quantity to 1 for services', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: serviceId,
      basePrice: decimal(75),
      isActive: true,
    });

    await serviceInstance.addServicePosition(workOrderId, dto());

    const createCall = prisma.workOrderService.create.mock.calls[0][0].data;
    expect(createCall.quantity).toBe(1);
    expect(createCall.total.equals(decimal(75))).toBe(true);
  });

  it('throws when service is not found or inactive', async () => {
    prisma.service.findFirst.mockResolvedValue(null);

    await expect(
      serviceInstance.addServicePosition(workOrderId, dto(1)),
    ).rejects.toThrow('Service not found');
    expect(prisma.workOrderService.create).not.toHaveBeenCalled();
  });

  it('throws when quantity is invalid (db rejects)', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: serviceId,
      basePrice: decimal(40),
      isActive: true,
    });
    prisma.workOrderService.create.mockRejectedValue(new Error('Invalid qty'));

    await expect(
      serviceInstance.addServicePosition(workOrderId, dto(-5)),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('throws when persisting service fails', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: serviceId,
      basePrice: decimal(40),
      isActive: true,
    });
    prisma.workOrderService.create.mockRejectedValue(new Error('DB error'));

    await expect(
      serviceInstance.addServicePosition(workOrderId, dto(1)),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('returns recalculated work order response', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: serviceId,
      basePrice: decimal(50),
      isActive: true,
    });
    const recalculated = { id: workOrderId, totalCost: decimal(100) };
    recalcSpy.mockResolvedValue(recalculated);

    const result = await serviceInstance.addServicePosition(workOrderId, dto(2));

    expect(result).toEqual(recalculated);
  });
});
