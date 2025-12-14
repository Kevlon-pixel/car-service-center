import { apiRequest } from "@features/auth/lib/session";
import { USER_ENDPOINTS } from "@shared/config/api";

export type SystemRole = "USER" | "WORKER" | "ADMIN";
export type UserStatusFilter = "verified" | "unverified";
export type UserSortOption = "surname-asc" | "surname-desc";

export const USER_STATUS_LABELS: Record<UserStatusFilter, string> = {
  verified: "Почта подтверждена",
  unverified: "Почта не подтверждена",
};

export const USER_STATUS_OPTIONS = [
  { value: "verified" as UserStatusFilter, label: USER_STATUS_LABELS.verified },
  {
    value: "unverified" as UserStatusFilter,
    label: USER_STATUS_LABELS.unverified,
  },
];

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone: string;
  role: SystemRole;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  status?: UserStatusFilter;
  sort?: UserSortOption;
  search?: string;
}

export async function fetchUsers(filters?: UserFilters) {
  return apiRequest<UserSummary[]>(USER_ENDPOINTS.all, {
    params: {
      status: filters?.status,
      sort: filters?.sort,
      search: filters?.search,
    },
  });
}

export async function updateUserRole(userId: string, role: SystemRole) {
  return apiRequest<UserSummary>(USER_ENDPOINTS.updateRole(userId), {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}
