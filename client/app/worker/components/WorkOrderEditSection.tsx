import { useEffect, useMemo, useState } from "react";

import {
  WORK_ORDER_STATUS_OPTIONS,
  WORK_ORDER_STATUS_LABELS,
  WorkOrder,
  WorkOrderStatus,
  fetchWorkOrders,
  updateWorkOrder,
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

interface ServiceDraftRow {
  id: string;
  serviceId: string;
  quantity: number;
  name?: string;
  unitPrice?: number;
}

interface PartDraftRow {
  id: string;
  partId: string;
  quantity: number;
  name?: string;
  article?: string;
  unitPrice?: number;
}

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
  const [serviceRows, setServiceRows] = useState<ServiceDraftRow[]>([]);
  const [partRows, setPartRows] = useState<PartDraftRow[]>([]);
  const [serviceDraft, setServiceDraft] = useState({
    serviceId: "",
    quantity: "1",
  });
  const [partDraft, setPartDraft] = useState({ partId: "", quantity: "1" });
  const [sort, setSort] = useState<SortOption>("created-desc");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
        err instanceof Error
          ? err.message
          : "Не удалось загрузить список заказ-нарядов"
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

  function formatInputValue(dateString: string) {
    // Keep wall time as stored (UTC string from API) without shifting timezone
    return dateString.slice(0, 16);
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
          ? formatInputValue(selectedOrder.plannedDate)
          : ""
      );
      setServiceRows(
        selectedOrder.services.map((row) => ({
          id: row.id,
          serviceId: row.serviceId,
          quantity: row.quantity,
          unitPrice: Number(row.price),
          name: row.service.name,
        })),
      );
      setPartRows(
        selectedOrder.parts.map((row) => ({
          id: row.id,
          partId: row.partId,
          quantity: row.quantity,
          unitPrice: Number(row.price),
          name: row.part.name,
          article: row.part.article,
        })),
      );
      setServiceDraft({ serviceId: "", quantity: "1" });
      setPartDraft({ partId: "", quantity: "1" });
    } else {
      setStatus("");
      setResponsible("");
      setPlannedDate("");
      setServiceRows([]);
      setPartRows([]);
      setServiceDraft({ serviceId: "", quantity: "1" });
      setPartDraft({ partId: "", quantity: "1" });
    }
  }, [selectedOrder]);

  const replaceOrder = (updated: WorkOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const resetDraft = () => {
    if (!selectedOrder) return;
    setStatus(selectedOrder.status);
    setResponsible(selectedOrder.responsibleWorker?.id ?? "");
      setPlannedDate(
        selectedOrder.plannedDate
          ? formatInputValue(selectedOrder.plannedDate)
          : ""
      );
    setServiceRows(
      selectedOrder.services.map((row) => ({
        id: row.id,
        serviceId: row.serviceId,
        quantity: row.quantity,
        unitPrice: Number(row.price),
        name: row.service.name,
      })),
    );
    setPartRows(
      selectedOrder.parts.map((row) => ({
        id: row.id,
        partId: row.partId,
        quantity: row.quantity,
        unitPrice: Number(row.price),
        name: row.part.name,
        article: row.part.article,
      })),
    );
    setServiceDraft({ serviceId: "", quantity: "1" });
    setPartDraft({ partId: "", quantity: "1" });
    setActionError(null);
    setSuccess(null);
  };

  const handleAddServiceRow = () => {
    if (!selectedOrder || !serviceDraft.serviceId) return;
    setActionError(null);
    setSuccess(null);
    const service = services.find((s) => s.id === serviceDraft.serviceId);
    setServiceRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        serviceId: serviceDraft.serviceId,
        quantity: Math.max(1, Number(serviceDraft.quantity) || 1),
        unitPrice: service ? Number(service.basePrice) : undefined,
        name: service?.name,
      },
    ]);
    setServiceDraft({ serviceId: "", quantity: "1" });
  };

  const handleRemoveServiceRow = (rowId: string) => {
    setActionError(null);
    setSuccess(null);
    setServiceRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleAddPartRow = () => {
    if (!selectedOrder || !partDraft.partId) return;
    setActionError(null);
    setSuccess(null);
    const part = parts.find((p) => p.id === partDraft.partId);
    setPartRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        partId: partDraft.partId,
        quantity: Math.max(1, Number(partDraft.quantity) || 1),
        unitPrice: part ? Number(part.price) : undefined,
        name: part?.name,
        article: part?.article,
      },
    ]);
    setPartDraft({ partId: "", quantity: "1" });
  };

  const handleRemovePartRow = (rowId: string) => {
    setActionError(null);
    setSuccess(null);
    setPartRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleSaveDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOrder) return;
    setActionError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const payload = {
        status: status || undefined,
        plannedDate: plannedDate || null,
        responsibleWorkerId: responsible || null,
        services: serviceRows.map((row) => ({
          serviceId: row.serviceId,
          quantity: row.quantity,
        })),
        parts: partRows.map((row) => ({
          partId: row.partId,
          quantity: row.quantity,
        })),
      };

      const updated = await updateWorkOrder(selectedOrder.id, payload);
      replaceOrder(updated);
      setSuccess("Заказ-наряд сохранен.");
      onUpdated?.();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Не удалось сохранить заказ-наряд"
      );
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (value?: number) =>
    value === undefined || Number.isNaN(value) ? "--" : value.toFixed(2);

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.muted}>Управление заказ-нарядами</p>
          <h3 style={{ margin: "4px 0 0" }}>
            Редактирование существующих заказ-нарядов
          </h3>
        </div>
        <div className={styles.filters}>
          <label className={styles.selectLabel}>
            <span className={styles.label}>Сортировка</span>
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
                {order.number} — {order.vehicle.make} {order.vehicle.model} (
                {order.vehicle.licensePlate}) —{" "}
                {WORK_ORDER_STATUS_LABELS[order.status]} —{" "}
                {new Date(order.createdAt).toLocaleString()}
              </option>
            ))}
          </select>
        </label>

        {selectedOrder && (
          <form className={styles.stack} onSubmit={handleSaveDraft}>
            <div className={styles.formGrid}>
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
                label="Планируемая дата"
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
                  <option value="">Без ответственного</option>
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
            </div>

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
                onClick={handleAddServiceRow}
              >
                Добавить услугу
              </Button>
            </div>

            {serviceRows.length > 0 && (
              <div className={styles.tableWrapper}>
                <div className={styles.tableTitle}>Услуги</div>
                <table className={styles.simpleTable}>
                  <thead>
                    <tr>
                      <th>Наименование</th>
                      <th>Кол-во</th>
                      <th>Цена</th>
                      <th>Сумма</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceRows.map((row) => {
                      const service = services.find(
                        (item) => item.id === row.serviceId
                      );
                      const unitPrice =
                        row.unitPrice ??
                        (service ? Number(service.basePrice) : undefined);
                      const total =
                        unitPrice !== undefined
                          ? unitPrice * row.quantity
                          : undefined;
                      return (
                        <tr key={row.id}>
                          <td>{row.name ?? service?.name ?? row.serviceId}</td>
                          <td>{row.quantity}</td>
                          <td>{formatMoney(unitPrice)}</td>
                          <td>{formatMoney(total)}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.linkButton}
                              onClick={() => handleRemoveServiceRow(row.id)}
                            >
                              Удалить
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
              <Button type="button" variant="outline" onClick={handleAddPartRow}>
                Добавить запчасть
              </Button>
            </div>

            {partRows.length > 0 && (
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {partRows.map((row) => {
                      const part = parts.find((item) => item.id === row.partId);
                      const unitPrice =
                        row.unitPrice ?? (part ? Number(part.price) : undefined);
                      const total =
                        unitPrice !== undefined
                          ? unitPrice * row.quantity
                          : undefined;
                      return (
                        <tr key={row.id}>
                          <td>{row.name ?? part?.name ?? row.partId}</td>
                          <td>{row.article ?? part?.article ?? "--"}</td>
                          <td>{row.quantity}</td>
                          <td>{formatMoney(unitPrice)}</td>
                          <td>{formatMoney(total)}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.linkButton}
                              onClick={() => handleRemovePartRow(row.id)}
                            >
                              Удалить
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button type="submit" disabled={loading || saving}>
                {saving ? "Сохраняем..." : "Сохранить изменения"}
              </Button>
              <Button type="button" variant="ghost" onClick={resetDraft}>
                Сбросить
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
