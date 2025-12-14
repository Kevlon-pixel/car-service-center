"use client";

import { useEffect, useMemo, useState } from "react";

import {
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_OPTIONS,
  WorkOrder,
  WorkOrderStatus,
  fetchWorkOrders,
} from "@features/work-order/api/workOrderApi";
import { Button } from "@shared/ui";
import styles from "../../dashboard/dashboard.module.scss";

const statusOptions: Array<{ value: WorkOrderStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Все статусы" },
  ...WORK_ORDER_STATUS_OPTIONS,
];

type SortOption = "created-desc" | "created-asc";

interface WorkOrdersListProps {
  reloadKey?: number;
}

const statusClassName: Record<WorkOrderStatus, string> = {
  DRAFT: "statusNew",
  PLANNED: "statusConfirmed",
  IN_PROGRESS: "statusInProgress",
  COMPLETED: "statusCompleted",
  CANCELLED: "statusCancelled",
};

export function WorkOrdersList({ reloadKey }: WorkOrdersListProps) {
  const [status, setStatus] = useState<WorkOrderStatus | "ALL">("ALL");
  const [sort, setSort] = useState<SortOption>("created-desc");
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async (selected: WorkOrderStatus | "ALL") => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWorkOrders(
        selected === "ALL" ? undefined : { status: selected },
      );
      setOrders(data);
      setVisibleCount(5);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить заказ-наряды",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(status);
  }, [status, reloadKey]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((a, b) =>
        sort === "created-desc"
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [orders, sort],
  );

  const visibleOrders = sortedOrders.slice(0, visibleCount);

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.muted}>Работа с заказ-нарядами</p>
          <h3 style={{ margin: "4px 0 0" }}>Заказ-наряды</h3>
        </div>
        <div className={styles.filters}>
          <label className={styles.selectLabel}>
            <span className={styles.label}>Статус</span>
            <select
              className={styles.select}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as WorkOrderStatus | "ALL")
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
            <span className={styles.label}>Сортировка по дате</span>
            <select
              className={styles.select}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
            >
              <option value="created-desc">Сначала новые</option>
              <option value="created-asc">Сначала старые</option>
            </select>
          </label>
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => loadOrders(status)}
          >
            Обновить
          </Button>
        </div>
      </div>

      {error && (
        <div className={styles.alert} style={{ margin: 0 }}>
          <span>{error}</span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => loadOrders(status)}
          >
            Повторить
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.muted}>Загрузка заказ-нарядов...</div>
      ) : visibleOrders.length === 0 ? (
        <div className={styles.muted}>Заказ-наряды не найдены.</div>
      ) : (
        <div className={styles.requestList}>
          {visibleOrders.map((order) => (
            <div key={order.id} className={styles.requestCard}>
              <div className={styles.requestHeader}>
                <div>
                  <p className={styles.requestTitle}>
                    {order.number} — {order.vehicle.make} {order.vehicle.model} (
                    {order.vehicle.licensePlate})
                  </p>
                  <div className={styles.requestMeta}>
                    <span>
                      Клиент: {order.client.name} {order.client.surname} —{" "}
                      {order.client.phone}
                    </span>
                    {order.responsibleWorker && (
                      <span>
                        Ответственный: {order.responsibleWorker.name}{" "}
                        {order.responsibleWorker.surname}
                      </span>
                    )}
                    {order.request?.desiredDate && (
                      <span>
                        Желаемая дата:{" "}
                        {new Date(order.request.desiredDate).toLocaleString()}
                      </span>
                    )}
                    {order.plannedDate && (
                      <span>
                        Плановая дата: {new Date(order.plannedDate).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    styles[statusClassName[order.status]]
                  }`}
                >
                  {WORK_ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className={styles.requestMeta}>
                <span>Создан: {new Date(order.createdAt).toLocaleString()}</span>
                {order.completedDate && (
                  <span>
                    Завершён: {new Date(order.completedDate).toLocaleString()}
                  </span>
                )}
                <span>Работы: {order.totalLaborCost}</span>
                <span>Запчасти: {order.totalPartsCost}</span>
                <span>Итого: {order.totalCost}</span>
              </div>

              {order.services.length > 0 && (
                <div className={styles.tableWrapper}>
                  <div className={styles.tableTitle}>Работы</div>
                  <table className={styles.simpleTable}>
                    <thead>
                      <tr>
                        <th>Наименование</th>
                        <th>Кол-во</th>
                        <th>Цена</th>
                        <th>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.services.map((row) => (
                        <tr key={row.id}>
                          <td>{row.service.name}</td>
                          <td>{row.quantity}</td>
                          <td>{row.price}</td>
                          <td>{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {order.parts.length > 0 && (
                <div className={styles.tableWrapper}>
                  <div className={styles.tableTitle}>Запчасти</div>
                  <table className={styles.simpleTable}>
                    <thead>
                      <tr>
                        <th>Наименование</th>
                        <th>Артикул</th>
                        <th>Кол-во</th>
                        <th>Цена</th>
                        <th>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.parts.map((row) => (
                        <tr key={row.id}>
                          <td>{row.part.name}</td>
                          <td>{row.part.article}</td>
                          <td>{row.quantity}</td>
                          <td>{row.price}</td>
                          <td>{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {visibleCount < sortedOrders.length && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() =>
              setVisibleCount((prev) => Math.min(prev + 5, sortedOrders.length))
            }
          >
            Показать ещё
          </button>
        </div>
      )}
    </div>
  );
}
