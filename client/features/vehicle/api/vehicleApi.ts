import { apiRequest } from '@features/auth/lib/session';
import { VEHICLE_ENDPOINTS } from '@shared/config/api';

export interface VehiclePayload {
  make: string;
  model: string;
  year?: number;
  vin?: string;
  licensePlate: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number | null;
  vin: string | null;
  licensePlate: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchMyVehicles() {
  return apiRequest<Vehicle[]>(VEHICLE_ENDPOINTS.my);
}

export async function addMyVehicle(payload: VehiclePayload) {
  return apiRequest<Vehicle>(VEHICLE_ENDPOINTS.add, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
