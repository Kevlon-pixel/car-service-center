import { Prisma } from '@prisma/client';
import { baseRequestInclude } from '../../service-request/type/request-with-relations.type';

export const workOrderInclude: Prisma.WorkOrderInclude = {
  client: {
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      role: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      make: true,
      model: true,
      licensePlate: true,
      year: true,
    },
  },
  responsibleWorker: {
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      role: true,
    },
  },
  request: {
    include: baseRequestInclude,
  },
  services: {
    include: {
      service: {
        select: { id: true, name: true, basePrice: true, durationMin: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
  parts: {
    include: {
      part: {
        select: {
          id: true,
          name: true,
          article: true,
          unit: true,
          price: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
};

export type WorkOrderWithRelations = Prisma.WorkOrderGetPayload<{
  include: typeof workOrderInclude;
}>;
