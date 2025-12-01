import { SystemRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  type: 'access' | 'refresh';
  role: SystemRole;
}
