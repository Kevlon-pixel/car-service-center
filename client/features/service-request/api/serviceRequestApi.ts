import { apiRequest } from "@features/auth/lib/session";
import { SERVICE_REQUEST_ENDPOINTS } from "@shared/config/api";

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
  status: string;
  createdAt: string;
  updatedAt: string;
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
