import { apiRequest } from "@features/auth/lib/session";
import { SERVICE_ENDPOINTS } from "@shared/config/api";

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  basePrice: string;
  durationMin?: number | null;
}

export async function fetchServices() {
  return apiRequest<ServiceItem[]>(SERVICE_ENDPOINTS.all, { useAuth: false });
}
