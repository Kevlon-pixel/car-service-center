"use client";

import { useCallback, useEffect, useState } from "react";

import {
  REQUEST_STATUS_OPTIONS,
  RequestStatus,
  ServiceRequestWithClient,
  fetchAllServiceRequests,
} from "@features/service-request/api/serviceRequestApi";
import { Button } from "@shared/ui";
import { ServiceRequestCard } from "./ServiceRequestCard";
import styles from "../../dashboard/dashboard.module.scss";

const statusOptions: Array<{ value: RequestStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Все" },
  ...REQUEST_STATUS_OPTIONS,
];

interface ServiceRequestsSectionProps {
  reloadKey?: number;
}

export function ServiceRequestsSection({ reloadKey }: ServiceRequestsSectionProps) {
  const [status, setStatus] = useState<RequestStatus | "ALL">("ALL");
  const [requests, setRequests] = useState<ServiceRequestWithClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [sort, setSort] = useState<"created-desc" | "created-asc">(
    "created-desc",
  );

  const loadRequests = useCallback(
    async (selected: RequestStatus | "ALL") => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllServiceRequests(
          selected === "ALL" ? undefined : { status: selected },
        );
        setRequests(data);
        setVisibleCount(5);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Не удалось загрузить заявки",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadRequests(status);
  }, [status, loadRequests, reloadKey]);

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.muted}>Заявки клиентов</p>
          <h3 style={{ margin: "4px 0 0" }}>Заявки</h3>
        </div>

        <div className={styles.filters}>
          <label className={styles.selectLabel}>
            <span className={styles.label}>Статус</span>
            <select
              className={styles.select}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as RequestStatus | "ALL")
              }
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.selectLabel}>
            <span className={styles.label}>Сортировка</span>
            <select
              className={styles.select}
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as "created-desc" | "created-asc")
              }
            >
              <option value="created-desc">Новые сверху</option>
              <option value="created-asc">Старые сверху</option>
            </select>
          </label>
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => loadRequests(status)}
          >
            Обновить
          </Button>
        </div>
      </div>

      {error && (
        <div className={styles.alert} style={{ margin: 0 }}>
          <span>{error}</span>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => loadRequests(status)}
          >
            Повторить
          </Button>
        </div>
      )}

      {loading ? (
        <div className={styles.muted}>Загружаем заявки...</div>
      ) : requests.length === 0 ? (
        <div className={styles.muted}>Заявок нет.</div>
      ) : (
        <>
          <div className={styles.requestList}>
            {[...requests]
              .sort((a, b) =>
                sort === "created-desc"
                  ? new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                  : new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
              )
              .slice(0, visibleCount)
              .map((request) => (
                <ServiceRequestCard key={request.id} request={request} />
              ))}
          </div>
          {visibleCount < requests.length && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setVisibleCount((prev) => Math.min(prev + 5, requests.length))
                }
              >
                Показать еще
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
