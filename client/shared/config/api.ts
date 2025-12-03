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
};

export const VEHICLE_ENDPOINTS = {
  my: '/vehicles/my',
  add: '/vehicles',
};
