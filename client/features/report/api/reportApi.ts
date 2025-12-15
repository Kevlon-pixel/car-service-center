import { apiRequest } from "@features/auth/lib/session";
import { REPORT_ENDPOINTS } from "@shared/config/api";

export interface FinancialReportServiceDetails {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  durationMin: number | null;
  isActive: boolean;
}

export interface FinancialReportPartDetails {
  id: string;
  name: string;
  article: string;
  unit: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
}

export interface FinancialReportServiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  service: FinancialReportServiceDetails | null;
}

export interface FinancialReportPartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  part: FinancialReportPartDetails | null;
}

export interface FinancialReport {
  period: {
    from: string;
    to: string;
  };
  revenue: number;
  completedOrders: number;
  incomingRequests: number;
  services: FinancialReportServiceItem[];
  parts: FinancialReportPartItem[];
}

export async function fetchFinancialReport(params: {
  fromDate: string;
  toDate: string;
}) {
  return apiRequest<FinancialReport>(REPORT_ENDPOINTS.financial, {
    params,
    useAuth: true,
  });
}

export async function fetchFinancialReportCsv(params: {
  fromDate: string;
  toDate: string;
}) {
  return apiRequest<string>(
    REPORT_ENDPOINTS.financialCsv,
    {
      params,
      headers: { Accept: "text/csv" },
    },
    { useAuth: true },
  );
}
