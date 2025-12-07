import { apiRequest } from "@features/auth/lib/session";
import { USER_ENDPOINTS } from "@shared/config/api";

export type SystemRole = "USER" | "WORKER" | "ADMIN";

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone: string;
  role: SystemRole;
}

export async function fetchUsers() {
  return apiRequest<UserSummary[]>(USER_ENDPOINTS.all);
}
