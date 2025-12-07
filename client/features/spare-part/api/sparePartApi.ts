import { apiRequest } from "@features/auth/lib/session";
import { SPARE_PART_ENDPOINTS } from "@shared/config/api";

export interface SparePartItem {
  id: string;
  name: string;
  article: string;
  unit: string;
  price: string;
  stockQuantity: number;
}

export async function fetchSpareParts(search?: string) {
  return apiRequest<SparePartItem[]>(SPARE_PART_ENDPOINTS.all, {
    params: search ? { search } : undefined,
    useAuth: false,
  });
}
