import { apiRequest } from "@features/auth/lib/session";
import { SPARE_PART_ENDPOINTS } from "@shared/config/api";

export interface SparePartItem {
  id: string;
  name: string;
  article: string;
  unit: string;
  price: string;
  stockQuantity: number;
  isActive: boolean;
}

export async function fetchSpareParts(search?: string, includeInactive?: boolean) {
  return apiRequest<SparePartItem[]>(SPARE_PART_ENDPOINTS.all, {
    params: {
      ...(search ? { search } : {}),
      ...(includeInactive ? { includeInactive: true } : {}),
    },
    useAuth: !!includeInactive ? true : false,
  });
}

export interface SparePartInput {
  name: string;
  article: string;
  unit: string;
  price: number;
  stockQuantity: number;
  isActive?: boolean;
}

export async function createSparePart(payload: SparePartInput) {
  return apiRequest<SparePartItem>(SPARE_PART_ENDPOINTS.all, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSparePart(id: string, payload: Partial<SparePartInput>) {
  return apiRequest<SparePartItem>(`${SPARE_PART_ENDPOINTS.all}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteSparePart(id: string) {
  return apiRequest<void>(`${SPARE_PART_ENDPOINTS.all}/${id}`, {
    method: "DELETE",
  });
}
