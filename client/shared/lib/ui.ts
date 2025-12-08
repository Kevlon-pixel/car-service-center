import { Dispatch, SetStateAction } from "react";

export const EMPTY_PLACEHOLDER = "—";

export function clearFeedback(
  setError: Dispatch<SetStateAction<string | null>>,
  setSuccess: Dispatch<SetStateAction<string | null>>,
) {
  setError(null);
  setSuccess(null);
}

export function formatMinutes(value?: number | null, suffix = "мин") {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return EMPTY_PLACEHOLDER;
  }
  return `${value} ${suffix}`;
}

export function formatMoney(value?: number | null, fractionDigits = 2) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return EMPTY_PLACEHOLDER;
  }
  return Number(value).toFixed(fractionDigits);
}
