export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const AUTH_ENDPOINTS = {
  register: '/auth/register',
  verify: '/auth/verify',
  login: '/auth/login',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
};

export const USER_ENDPOINTS = {
  me: '/users/me',
  all: '/users',
  updateRole: (id: string) => `/users/${id}/role`,
};

export const VEHICLE_ENDPOINTS = {
  my: '/vehicles/my',
  add: '/vehicles',
};

export const SERVICE_REQUEST_ENDPOINTS = {
  create: '/service-requests',
  my: '/service-requests/my',
  all: '/service-requests',
  updateStatus: (id: string) => `/service-requests/${id}/status`,
};

export const WORK_ORDER_ENDPOINTS = {
  base: '/work-orders',
  all: '/work-orders',
  byId: (id: string) => `/work-orders/${id}`,
  create: '/work-orders',
  update: (id: string) => `/work-orders/${id}`,
  addService: (id: string) => `/work-orders/${id}/services`,
  addPart: (id: string) => `/work-orders/${id}/parts`,
  updateStatus: (id: string) => `/work-orders/${id}/status`,
};

export const SERVICE_ENDPOINTS = {
  all: '/services',
};

export const SPARE_PART_ENDPOINTS = {
  all: '/spare-parts',
};
