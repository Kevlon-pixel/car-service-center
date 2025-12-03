import { Prisma } from '@prisma/client';

export const baseRequestInclude: Prisma.ServiceRequestInclude = {
  vehicle: {
    select: {
      id: true,
      make: true,
      model: true,
      licensePlate: true,
      year: true,
    },
  },
};

export type RequestWithRelations = Prisma.ServiceRequestGetPayload<{
  include: typeof baseRequestInclude;
}>;
