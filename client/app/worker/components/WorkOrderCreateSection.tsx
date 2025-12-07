import { useEffect, useMemo, useState } from "react";

import {
  REQUEST_STATUS_LABELS,
  RequestStatus,
  ServiceRequestWithClient,
  fetchAllServiceRequests,
  updateServiceRequestStatus,
} from "@features/service-request/api/serviceRequestApi";
import {
  WORK_ORDER_STATUS_LABELS,
  WorkOrder,
  WorkOrderStatus,
  addWorkOrderPart,
  addWorkOrderService,
  createWorkOrder,
  fetchWorkOrders,
  updateWorkOrderStatus,
} from "@features/work-order/api/workOrderApi";
import { fetchServices, ServiceItem } from "@features/service/api/serviceApi";
import {
  SparePartItem,
  fetchSpareParts,
} from "@features/spare-part/api/sparePartApi";
import { UserProfile } from "@features/auth/api/authApi";
import { fetchUsers, UserSummary } from "@features/user/api/userApi";
import { Button, TextInput } from "@shared/ui";
import styles from "../../dashboard/dashboard.module.scss";

interface WorkOrderCreateSectionProps {
  profile: UserProfile;
  onCreated?: () => void;
}

interface ServiceSelectionRow {
  id: string;
  serviceId: string;
  quantity: number;
}

interface PartSelectionRow {
  id: string;
  partId: string;
  quantity: number;
}

export function WorkOrderCreateSection({
  profile,
  onCreated,
}: WorkOrderCreateSectionProps) {
  const nowInput = useMemo(
    () => {
      const date = new Date();
      const offset = date.getTimezoneOffset();
      const local = new Date(date.getTime() - offset * 60000);
      return local.toISOString().slice(0, 16);
    },
    [],
  );
  const [requests, setRequests] = useState<ServiceRequestWithClient[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [parts, setParts] = useState<SparePartItem[]>([]);
  const [workers, setWorkers] = useState<UserSummary[]>([]);
  const [sort, setSort] = useState<"created-desc" | "created-asc">(
    "created-desc",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    requestId: string;
    plannedDate: string;
    responsibleWorkerId: string | "";
  }>({
    requestId: "",
    plannedDate: "",
    responsibleWorkerId: profile.id,
  });

  const [serviceRows, setServiceRows] = useState<ServiceSelectionRow[]>([]);
  const [partRows, setPartRows] = useState<PartSelectionRow[]>([]);
  const [serviceDraft, setServiceDraft] = useState<{
    serviceId: string;
    quantity: string;
  }>({ serviceId: "", quantity: "1" });
  const [partDraft, setPartDraft] = useState<{
    partId: string;
    quantity: string;
  }>({ partId: "", quantity: "1" });

  const availableRequests = useMemo(() => {
    const usedRequestIds = new Set(
      workOrders
        .map((order) => order.requestId)
        .filter((id): id is string => Boolean(id)),
    );

    const filtered = requests.filter(
      (req) =>
        !usedRequestIds.has(req.id) &&
        req.status !== "CANCELLED" &&
        req.status !== "COMPLETED",
    );

    const sorted = [...filtered].sort((a, b) =>
      sort === "created-desc"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    return sorted.slice(0, 20);
  }, [requests, workOrders, sort]);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [reqs, orders, serviceList, partList] = await Promise.all([
        fetchAllServiceRequests(),
        fetchWorkOrders(),
        fetchServices(),
        fetchSpareParts(),
      ]);
      setRequests(reqs);
      setWorkOrders(orders);
      setServices(serviceList);
      setParts(partList);

      try {
        const allUsers = await fetchUsers();
        const workerUsers = allUsers.filter(
          (u) => u.role === "WORKER" || u.role === "ADMIN",
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
      setLoadError(
        err instanceof Error ? err.message : "Не удалось загрузить данные",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      requestId: "",
      plannedDate: "",
      responsibleWorkerId: profile.id,
    });
    setServiceRows([]);
    setPartRows([]);
    setServiceDraft({ serviceId: "", quantity: "1" });
    setPartDraft({ partId: "", quantity: "1" });
  };

  const handleAddServiceRow = () => {
    if (!serviceDraft.serviceId) return;
    setServiceRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        serviceId: serviceDraft.serviceId,
        quantity: Math.max(1, Number(serviceDraft.quantity) || 1),
      },
    ]);
    setServiceDraft({ serviceId: "", quantity: "1" });
  };

  const handleAddPartRow = () => {
    if (!partDraft.partId) return;
    setPartRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        partId: partDraft.partId,
        quantity: Math.max(1, Number(partDraft.quantity) || 1),
      },
    ]);
    setPartDraft({ partId: "", quantity: "1" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.requestId) {
      setSubmitError("Сначала выберите заявку");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccess(null);

    try {
      const created = await createWorkOrder({
        requestId: form.requestId,
        plannedDate: form.plannedDate || undefined,
        responsibleWorkerId: form.responsibleWorkerId || undefined,
      });

      let currentOrder = created;

      for (const row of serviceRows) {
        currentOrder = await addWorkOrderService(created.id, {
          serviceId: row.serviceId,
          quantity: row.quantity,
        });
      }

      for (const row of partRows) {
        currentOrder = await addWorkOrderPart(created.id, {
          partId: row.partId,
          quantity: row.quantity,
        });
      }

      const shouldPlan =
        Boolean(form.plannedDate) ||
        serviceRows.length > 0 ||
        partRows.length > 0 ||
        Boolean(form.responsibleWorkerId);

      if (shouldPlan && currentOrder.status === "DRAFT") {
        currentOrder = await updateWorkOrderStatus(
          currentOrder.id,
          "PLANNED" as WorkOrderStatus,
        );
      }

      await updateServiceRequestStatus(form.requestId, "CONFIRMED");

      setSuccess(
        `Заказ-наряд ${currentOrder.number} создан (${WORK_ORDER_STATUS_LABELS[currentOrder.status]}).`,
      );
      resetForm();
      loadData();
      onCreated?.();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Не удалось создать заказ-наряд",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRequest = form.requestId
    ? availableRequests.find((req) => req.id === form.requestId) ??
      requests.find((req) => req.id === form.requestId)
    : null;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.muted}>Создание заказ-наряда</p>
          <h3 style={{ margin: "4px 0 0" }}>На основе заявки</h3>
        </div>
        <div className={styles.filters}>
          <label className={styles.selectLabel}>
            <span className={styles.label}>Сортировка по дате</span>
            <select
              className={styles.select}
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as "created-desc" | "created-asc")
              }
            >
              <option value="created-desc">Сначала новые</option>
              <option value="created-asc">Сначала старые</option>
            </select>
          </label>
          <Button type="button" variant="ghost" onClick={loadData} disabled={loading}>
            Обновить
          </Button>
        </div>
      </div>

      {loadError && (
        <div className={styles.alert} style={{ margin: 0 }}>
          <span>{loadError}</span>
          <Button type="button" variant="outline" onClick={loadData}>
            Повторить
          </Button>
        </div>
      )}

        <form className={styles.stack} onSubmit={handleSubmit}>

        <div className={styles.formGrid}>
          <label className={styles.selectLabel}>
            <span className={styles.label}>Заявка</span>
            <select
              className={styles.select}
              required
              value={form.requestId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, requestId: event.target.value }))
              }
            >
              <option value="">Не выбрано</option>
              {availableRequests.map((req) => {
                const created = new Date(req.createdAt).toLocaleString("ru-RU");
                return (
                  <option key={req.id} value={req.id}>
                    {req.vehicle.make} {req.vehicle.model} ({req.vehicle.licensePlate})
                    {" · "}
                    {REQUEST_STATUS_LABELS[req.status as RequestStatus]}
                    {" · "}
                    {created}
                  </option>
                );
              })}
            </select>
          </label>
        </div>

        {!form.requestId && (
          <span className={styles.note}>
            Сначала выберите заявку, чтобы заполнить заказ-наряд.
          </span>
        )}

        {form.requestId && (
          <>
            <div className={styles.formGrid}>
              <TextInput
                label="Плановая дата"
                type="datetime-local"
                min={nowInput}
                value={form.plannedDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, plannedDate: e.target.value }))
                }
              />

              <label className={styles.selectLabel}>
                <span className={styles.label}>Ответственный</span>
                <select
                  className={styles.select}
                  value={form.responsibleWorkerId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      responsibleWorkerId: event.target.value,
                    }))
                  }
                >
                  <option value={profile.id}>
                    Я ({profile.name} {profile.surname})
                  </option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} {worker.surname}
                    </option>
                  ))}
                  <option value="">Без назначения</option>
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
                  setServiceDraft((prev) => ({ ...prev, quantity: e.target.value }))
                }
              />
              <Button type="button" variant="outline" onClick={handleAddServiceRow}>
                Добавить услугу
              </Button>
            </div>

            {serviceRows.length > 0 && (
              <div className={styles.tableWrapper}>
                <table className={styles.simpleTable}>
                  <thead>
                    <tr>
                      <th>Услуга</th>
                      <th>Кол-во</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceRows.map((row) => {
                      const service = services.find((s) => s.id === row.serviceId);
                      return (
                        <tr key={row.id}>
                          <td>{service?.name ?? row.serviceId}</td>
                          <td>{row.quantity}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.linkButton}
                              onClick={() =>
                                setServiceRows((prev) =>
                                  prev.filter((item) => item.id !== row.id),
                                )
                              }
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
                  setPartDraft((prev) => ({ ...prev, quantity: e.target.value }))
                }
              />
              <Button type="button" variant="outline" onClick={handleAddPartRow}>
                Добавить запчасть
              </Button>
            </div>

            {partRows.length > 0 && (
              <div className={styles.tableWrapper}>
                <table className={styles.simpleTable}>
                  <thead>
                    <tr>
                      <th>Запчасть</th>
                      <th>Кол-во</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {partRows.map((row) => {
                      const part = parts.find((p) => p.id === row.partId);
                      return (
                        <tr key={row.id}>
                          <td>{part ? `${part.name} (${part.article})` : row.partId}</td>
                          <td>{row.quantity}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.linkButton}
                              onClick={() =>
                                setPartRows((prev) =>
                                  prev.filter((item) => item.id !== row.id),
                                )
                              }
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

            {submitError && (
              <div className={styles.alert} style={{ margin: 0 }}>
                <span>{submitError}</span>
              </div>
            )}

            {success && <div className={styles.success}>{success}</div>}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button type="submit" disabled={submitting || loading}>
                {submitting ? "Создаем…" : "Создать заказ-наряд"}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Сбросить
              </Button>
              {availableRequests.length === 0 && (
                <span className={styles.note}>
                  Нет доступных заявок для создания заказ-наряда.
                </span>
              )}
              {selectedRequest && (
                <span className={styles.note}>
                  Клиент: {selectedRequest.client.name} {selectedRequest.client.surname} ·{" "}
                  {selectedRequest.client.phone}
                </span>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
