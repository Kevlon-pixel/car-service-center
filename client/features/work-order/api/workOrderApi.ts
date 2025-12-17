import { apiRequest } from "@features/auth/lib/session";
import { WORK_ORDER_ENDPOINTS } from "@shared/config/api";
import {
  RequestStatus,
  ServiceRequest,
} from "@features/service-request/api/serviceRequestApi";
import { UserSummary } from "@features/user/api/userApi";
import { ServiceItem } from "@features/service/api/serviceApi";
import { SparePartItem } from "@features/spare-part/api/sparePartApi";

export type WorkOrderStatus =
  | "DRAFT"
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  DRAFT: "Черновик",
  PLANNED: "Запланирован",
  IN_PROGRESS: "В работе",
  COMPLETED: "Выполнен",
  CANCELLED: "Отменен",
};

export const WORK_ORDER_STATUS_OPTIONS = Object.entries(
  WORK_ORDER_STATUS_LABELS,
).map(([value, label]) => ({ value: value as WorkOrderStatus, label }));

export interface WorkOrderServiceRow {
  id: string;
  serviceId: string;
  quantity: number;
  price: string;
  total: string;
  service: Pick<ServiceItem, "id" | "name" | "basePrice" | "durationMin">;
}

export interface WorkOrderPartRow {
  id: string;
  partId: string;
  quantity: number;
  price: string;
  total: string;
  part: Pick<SparePartItem, "id" | "name" | "article" | "unit" | "price">;
}

export interface WorkOrder {
  id: string;
  number: string;
  clientId: string;
  vehicleId: string;
  requestId: string | null;
  responsibleWorkerId?: string | null;
  status: WorkOrderStatus;
  plannedDate?: string | null;
  completedDate?: string | null;
  totalLaborCost: string;
  totalPartsCost: string;
  totalCost: string;
  createdAt: string;
  updatedAt: string;
  client: UserSummary;
  vehicle: {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
    year: number | null;
  };
  responsibleWorker?: UserSummary | null;
  request?: (ServiceRequest & {
    vehicle: WorkOrder["vehicle"];
  }) | null;
  services: WorkOrderServiceRow[];
  parts: WorkOrderPartRow[];
}

export interface CreateWorkOrderPayload {
  requestId: string;
  responsibleWorkerId?: string;
  plannedDate?: string;
}

export interface WorkOrderServiceInput {
  serviceId: string;
  quantity: number;
}

export interface WorkOrderPartInput {
  partId: string;
  quantity: number;
}

export interface WorkOrderFilters {
  status?: WorkOrderStatus;
}

export async function fetchWorkOrders(filters?: WorkOrderFilters) {
  return apiRequest<WorkOrder[]>(WORK_ORDER_ENDPOINTS.all, {
    params: {
      status: filters?.status,
    },
  });
}

export async function createWorkOrder(payload: CreateWorkOrderPayload) {
  return apiRequest<WorkOrder>(WORK_ORDER_ENDPOINTS.create, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function addWorkOrderService(
  id: string,
  payload: { serviceId: string; quantity?: number },
) {
  return apiRequest<WorkOrder>(WORK_ORDER_ENDPOINTS.addService(id), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function addWorkOrderPart(
  id: string,
  payload: { partId: string; quantity?: number },
) {
  return apiRequest<WorkOrder>(WORK_ORDER_ENDPOINTS.addPart(id), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkOrderService(id: string, rowId: string) {
  return apiRequest<WorkOrder>(`${WORK_ORDER_ENDPOINTS.addService(id)}/${rowId}`, {
    method: "DELETE",
  });
}

export async function deleteWorkOrderPart(id: string, rowId: string) {
  return apiRequest<WorkOrder>(`${WORK_ORDER_ENDPOINTS.addPart(id)}/${rowId}`, {
    method: "DELETE",
  });
}

export async function updateWorkOrderStatus(id: string, status: WorkOrderStatus) {
  return apiRequest<WorkOrder>(WORK_ORDER_ENDPOINTS.updateStatus(id), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export interface UpdateWorkOrderPayload {
  status?: WorkOrderStatus;
  responsibleWorkerId?: string | null;
  plannedDate?: string | null;
  services?: WorkOrderServiceInput[];
  parts?: WorkOrderPartInput[];
}

export async function updateWorkOrder(
  id: string,
  payload: UpdateWorkOrderPayload,
) {
  return apiRequest<WorkOrder>(WORK_ORDER_ENDPOINTS.update(id), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export const updateWorkOrderDetails = updateWorkOrder;
