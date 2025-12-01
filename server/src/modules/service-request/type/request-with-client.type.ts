import { Prisma } from '@prisma/client';
import { baseRequestInclude } from './request-with-relations.type';

export const adminRequestInclude: Prisma.ServiceRequestInclude = {
  ...baseRequestInclude,
  client: {
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      phone: true,
      role: true,
    },
  },
};

export type RequestWithClient = Prisma.ServiceRequestGetPayload<{
  include: typeof adminRequestInclude;
}>;
