import { apiRequest } from "@features/auth/lib/session";
import { SERVICE_REQUEST_ENDPOINTS } from "@shared/config/api";

export type RequestStatus = "NEW" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: "Новая",
  CONFIRMED: "Подтверждена",
  CANCELLED: "Отменена",
  COMPLETED: "Завершена",
};

export const REQUEST_STATUS_OPTIONS = Object.entries(
  REQUEST_STATUS_LABELS,
).map(([value, label]) => ({ value: value as RequestStatus, label }));

export interface CreateServiceRequestPayload {
  vehicleId: string;
  desiredDate?: string;
  comment: string;
}

export interface ServiceRequest {
  id: string;
  vehicleId: string;
  clientId: string;
  serviceId?: string | null;
  desiredDate?: string | null;
  comment?: string | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestWithClient extends ServiceRequest {
  vehicle: {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
    year: number | null;
  };
  client: {
    id: string;
    email: string;
    name: string;
    surname: string;
    phone: string;
    role: string;
  };
}

export interface ServiceRequestFilters {
  status?: RequestStatus;
}

export async function createServiceRequest(payload: CreateServiceRequestPayload) {
  return apiRequest<ServiceRequest>(SERVICE_REQUEST_ENDPOINTS.create, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMyServiceRequests() {
  return apiRequest<ServiceRequest[]>(SERVICE_REQUEST_ENDPOINTS.my);
}

export async function fetchAllServiceRequests(filters?: ServiceRequestFilters) {
  return apiRequest<ServiceRequestWithClient[]>(SERVICE_REQUEST_ENDPOINTS.all, {
    params: {
      status: filters?.status,
    },
  });
}

export async function updateServiceRequestStatus(
  id: string,
  status: RequestStatus,
) {
  return apiRequest<ServiceRequest>(SERVICE_REQUEST_ENDPOINTS.updateStatus(id), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
