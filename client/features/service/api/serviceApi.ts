import { apiRequest } from "@features/auth/lib/session";
import { SERVICE_ENDPOINTS } from "@shared/config/api";

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  basePrice: string;
  durationMin?: number | null;
  isActive: boolean;
}

export async function fetchServices(search?: string, includeInactive?: boolean) {
  return apiRequest<ServiceItem[]>(
    SERVICE_ENDPOINTS.all,
    {
      params: {
        ...(search ? { search } : {}),
        ...(includeInactive ? { includeInactive: true } : {}),
      },
    },
    { useAuth: Boolean(includeInactive) },
  );
}

export interface ServiceInput {
  name: string;
  description?: string;
  basePrice: number;
  durationMin?: number;
  isActive?: boolean;
}

export async function createService(payload: ServiceInput) {
  return apiRequest<ServiceItem>(SERVICE_ENDPOINTS.all, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateService(id: string, payload: Partial<ServiceInput>) {
  return apiRequest<ServiceItem>(`${SERVICE_ENDPOINTS.all}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteService(id: string) {
  return apiRequest<void>(`${SERVICE_ENDPOINTS.all}/${id}`, {
    method: "DELETE",
  });
}
