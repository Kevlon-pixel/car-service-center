import { useEffect, useMemo, useState } from "react";

import {
  WORK_ORDER_STATUS_OPTIONS,
  WORK_ORDER_STATUS_LABELS,
  WorkOrder,
  WorkOrderStatus,
  addWorkOrderPart,
  addWorkOrderService,
  deleteWorkOrderPart,
  deleteWorkOrderService,
  fetchWorkOrders,
  updateWorkOrderDetails,
  updateWorkOrderStatus,
} from "@features/work-order/api/workOrderApi";
import { fetchServices, ServiceItem } from "@features/service/api/serviceApi";
import {
  SparePartItem,
  fetchSpareParts,
} from "@features/spare-part/api/sparePartApi";
import { fetchUsers, UserSummary } from "@features/user/api/userApi";
import { UserProfile } from "@features/auth/api/authApi";
import { Button, TextInput } from "@shared/ui";
import styles from "../../dashboard/dashboard.module.scss";

interface WorkOrderEditSectionProps {
  profile: UserProfile;
  onUpdated?: () => void;
}

type SortOption = "created-desc" | "created-asc";

export function WorkOrderEditSection({
  profile,
  onUpdated,
}: WorkOrderEditSectionProps) {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [parts, setParts] = useState<SparePartItem[]>([]);
  const [workers, setWorkers] = useState<UserSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [status, setStatus] = useState<WorkOrderStatus | "">("");
  const [plannedDate, setPlannedDate] = useState<string>("");
  const [responsible, setResponsible] = useState<string>("");
  const [serviceDraft, setServiceDraft] = useState({
    serviceId: "",
    quantity: "1",
  });
  const [partDraft, setPartDraft] = useState({ partId: "", quantity: "1" });
  const [sort, setSort] = useState<SortOption>("created-desc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, serviceList, partList] = await Promise.all([
        fetchWorkOrders(),
        fetchServices(),
        fetchSpareParts(),
      ]);
      setOrders(ordersData);
      setServices(serviceList);
      setParts(partList);

      try {
        const allUsers = await fetchUsers();
        const workerUsers = allUsers.filter(
          (u) => u.role === "WORKER" || u.role === "ADMIN"
        );
        const withSelf = [
          ...workerUsers,
          {
            id: profile.id,
            name: profile.name,
            surname: profile.surname,
            email: profile.email,
            phone: profile.phone,
            role: profile.role as UserSummary["role"],
          },
        ];
        const deduped = Array.from(
          new Map(withSelf.map((u) => [u.id, u])).values(),
        );
        setWorkers(deduped);
      } catch {
        setWorkers([
          {
            id: profile.id,
            name: profile.name,
            surname: profile.surname,
            email: profile.email,
            phone: profile.phone,
            role: profile.role as UserSummary["role"],
          },
        ]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось загрузить заказ-наряды"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedId),
    [orders, selectedId]
  );

  const formattedOrders = useMemo(() => {
    return [...orders].sort((a, b) =>
      sort === "created-desc"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [orders, sort]);

function toLocalInput(dateString: string) {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function nowLocalInput() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

  useEffect(() => {
    if (selectedOrder) {
      setStatus(selectedOrder.status);
      setResponsible(selectedOrder.responsibleWorker?.id ?? "");
      setPlannedDate(
        selectedOrder.plannedDate
          ? toLocalInput(selectedOrder.plannedDate)
          : ""
      );
    }
  }, [selectedOrder]);

  const replaceOrder = (updated: WorkOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleSaveDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOrder) return;
    setActionError(null);
    setSuccess(null);
    try {
      const updated = await updateWorkOrderDetails(selectedOrder.id, {
        plannedDate: plannedDate || null,
        responsibleWorkerId: responsible || null,
      });
      let current = updated;
      if (status && status !== updated.status) {
        current = await updateWorkOrderStatus(updated.id, status);
      }
      replaceOrder(current);
      setSuccess("Заказ-наряд обновлен.");
      onUpdated?.();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось обновить заказ-наряд"
      );
    }
  };

  const handleAddService = async () => {
    if (!selectedOrder || !serviceDraft.serviceId) return;
    setActionError(null);
    setSuccess(null);
    try {
      const updated = await addWorkOrderService(selectedOrder.id, {
        serviceId: serviceDraft.serviceId,
        quantity: Math.max(1, Number(serviceDraft.quantity) || 1),
      });
      replaceOrder(updated);
      setServiceDraft({ serviceId: "", quantity: "1" });
      setSuccess("Услуга добавлена.");
      onUpdated?.();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось добавить услугу"
      );
    }
  };

  const handleDeleteService = async (rowId: string) => {
    if (!selectedOrder) return;
    setActionError(null);
    setSuccess(null);
    try {
      const updated = await deleteWorkOrderService(selectedOrder.id, rowId);
      replaceOrder(updated);
      setSuccess("Услуга удалена.");
      onUpdated?.();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось удалить услугу",
      );
    }
  };

  const handleAddPart = async () => {
    if (!selectedOrder || !partDraft.partId) return;
    setActionError(null);
    setSuccess(null);
    try {
      const updated = await addWorkOrderPart(selectedOrder.id, {
        partId: partDraft.partId,
        quantity: Math.max(1, Number(partDraft.quantity) || 1),
      });
      replaceOrder(updated);
      setPartDraft({ partId: "", quantity: "1" });
      setSuccess("Запчасть добавлена.");
      onUpdated?.();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось добавить запчасть"
      );
    }
  };

  const handleDeletePart = async (rowId: string) => {
    if (!selectedOrder) return;
    setActionError(null);
    setSuccess(null);
    try {
      const updated = await deleteWorkOrderPart(selectedOrder.id, rowId);
      replaceOrder(updated);
      setSuccess("Запчасть удалена.");
      onUpdated?.();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось удалить запчасть",
      );
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.muted}>Редактирование заказ-нарядов</p>
          <h3 style={{ margin: "4px 0 0" }}>Изменить и дополнить</h3>
        </div>
        <div className={styles.filters}>
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
            onClick={loadData}
            disabled={loading}
          >
            Обновить
          </Button>
        </div>
      </div>

      {error && (
        <div className={styles.alert} style={{ margin: 0 }}>
          <span>{error}</span>
          <Button type="button" variant="outline" onClick={loadData}>
            Повторить
          </Button>
        </div>
      )}

      <div className={styles.stack}>
        <label className={styles.selectLabel}>
          <span className={styles.label}>Выберите заказ-наряд</span>
          <select
            className={styles.select}
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            <option value="">Не выбрано</option>
            {formattedOrders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.number} · {order.vehicle.make} {order.vehicle.model} (
                {order.vehicle.licensePlate}) ·{" "}
                {WORK_ORDER_STATUS_LABELS[order.status]} ·{" "}
                {new Date(order.createdAt).toLocaleString()}
              </option>
            ))}
          </select>
        </label>

        {selectedOrder && (
          <>
            <form className={styles.formGrid} onSubmit={handleSaveDetails}>
              <label className={styles.selectLabel}>
                <span className={styles.label}>Статус</span>
                <select
                  className={styles.select}
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as WorkOrderStatus)
                  }
                >
                  {WORK_ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <TextInput
                label="Плановая дата"
                type="datetime-local"
                min={nowLocalInput()}
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
              />

              <label className={styles.selectLabel}>
                <span className={styles.label}>Ответственный</span>
                <select
                  className={styles.select}
                  value={responsible}
                  onChange={(event) => setResponsible(event.target.value)}
                >
                  <option value="">Не назначен</option>
                  <option value={profile.id}>
                    Я ({profile.name} {profile.surname})
                  </option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} {worker.surname}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                <Button type="submit" disabled={loading}>
                  Сохранить изменения
                </Button>
              </div>
            </form>

            <div className={styles.inlineForm}>
              <label className={styles.selectLabel}>
                <span className={styles.label}>Услуга</span>
                <select
                  className={styles.select}
                  value={serviceDraft.serviceId}
                  onChange={(event) =>
                    setServiceDraft((prev) => ({
                      ...prev,
                      serviceId: event.target.value,
                    }))
                  }
                >
                  <option value="">Выберите услугу</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>
              <TextInput
                label="Кол-во"
                type="number"
                min="1"
                value={serviceDraft.quantity}
                onChange={(e) =>
                  setServiceDraft((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddService}
              >
                Добавить услугу
              </Button>
            </div>

            {selectedOrder.services.length > 0 && (
              <div className={styles.tableWrapper}>
                <div className={styles.tableTitle}>Текущие услуги</div>
                <table className={styles.simpleTable}>
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Кол-во</th>
                      <th>Цена</th>
                      <th>Сумма</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.services.map((row) => (
                      <tr key={row.id}>
                        <td>{row.service.name}</td>
                        <td>{row.quantity}</td>
                        <td>{row.price}</td>
                        <td>{row.total}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.linkButton}
                            onClick={() => handleDeleteService(row.id)}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className={styles.inlineForm}>
              <label className={styles.selectLabel}>
                <span className={styles.label}>Запчасть</span>
                <select
                  className={styles.select}
                  value={partDraft.partId}
                  onChange={(event) =>
                    setPartDraft((prev) => ({
                      ...prev,
                      partId: event.target.value,
                    }))
                  }
                >
                  <option value="">Выберите запчасть</option>
                  {parts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.name} ({part.article})
                    </option>
                  ))}
                </select>
              </label>
              <TextInput
                label="Кол-во"
                type="number"
                min="1"
                value={partDraft.quantity}
                onChange={(e) =>
                  setPartDraft((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
              />
              <Button type="button" variant="outline" onClick={handleAddPart}>
                Добавить запчасть
              </Button>
            </div>

            {selectedOrder.parts.length > 0 && (
              <div className={styles.tableWrapper}>
                <div className={styles.tableTitle}>Текущие запчасти</div>
                <table className={styles.simpleTable}>
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Артикул</th>
                      <th>Кол-во</th>
                      <th>Цена</th>
                      <th>Сумма</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.parts.map((row) => (
                      <tr key={row.id}>
                        <td>{row.part.name}</td>
                        <td>{row.part.article}</td>
                        <td>{row.quantity}</td>
                        <td>{row.price}</td>
                        <td>{row.total}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.linkButton}
                            onClick={() => handleDeletePart(row.id)}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {actionError && (
              <div className={styles.alert} style={{ margin: 0 }}>
                <span>{actionError}</span>
              </div>
            )}
            {success && <div className={styles.success}>{success}</div>}
          </>
        )}
      </div>
    </div>
  );
}
