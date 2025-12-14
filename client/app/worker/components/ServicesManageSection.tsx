"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ServiceInput,
  ServiceItem,
  createService,
  deleteService,
  fetchServices,
  updateService,
} from "@features/service/api/serviceApi";
import { clearFeedback, formatMinutes } from "@shared/lib/ui";
import { Button, TextInput } from "@shared/ui";
import styles from "../../dashboard/dashboard.module.scss";

interface ServicesManageSectionProps {
  onChanged?: () => void;
}

const initialForm: ServiceInput = {
  name: "",
  description: "",
  basePrice: 0,
  durationMin: 0,
  isActive: true,
};

export function ServicesManageSection({ onChanged }: ServicesManageSectionProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceInput>(initialForm);

  const isEditing = Boolean(editId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServices(appliedSearch.trim() || undefined, true);
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить услуги");
    } finally {
      setLoading(false);
    }
  }, [appliedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedServices = useMemo(() => {
    const sorted = [...services].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    return sortAsc ? sorted : sorted.reverse();
  }, [services, sortAsc]);

  const resetForm = () => {
    setEditId(null);
    setForm(initialForm);
    clearFeedback(setActionError, setSuccess);
  };

  const startEdit = (service: ServiceItem) => {
    setEditId(service.id);
    setForm({
      name: service.name,
      description: service.description ?? "",
      basePrice: Number(service.basePrice),
      durationMin: service.durationMin ?? undefined,
      isActive: service.isActive,
    });
    clearFeedback(setActionError, setSuccess);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    clearFeedback(setActionError, setSuccess);

    try {
      if (editId) {
        const updated = await updateService(editId, form);
        setServices((prev) => prev.map((s) => (s.id === editId ? updated : s)));
        setSuccess("Услуга обновлена.");
      } else {
        const created = await createService(form);
        setServices((prev) => [...prev, created]);
        setSuccess("Услуга создана.");
      }
      onChanged?.();
      resetForm();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось сохранить услугу",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    clearFeedback(setActionError, setSuccess);
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      onChanged?.();
      if (editId === id) {
        resetForm();
      }
      setSuccess("Услуга удалена.");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось удалить услугу",
      );
    } finally {
      setSaving(false);
    }
  };

  const sortLabel = sortAsc ? "Название А–Я" : "Название Я–А";

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.muted}>Управление услугами</p>
          <h3 style={{ margin: "4px 0 0" }}>Услуги</h3>
        </div>
        <div className={styles.filters} style={{ gap: 12, flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div style={{ minWidth: 260, maxWidth: 360, width: "100%" }}>
              <TextInput
                label="Поиск по названию"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setAppliedSearch(search.trim())}
              disabled={loading}
            >
              Найти
            </Button>
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setSortAsc((prev) => !prev)}
              disabled={loading}
            >
              Сортировка: {sortLabel}
            </Button>
            <Button type="button" variant="ghost" onClick={load} disabled={loading}>
              Обновить
            </Button>
          </div>
        </div>
      </div>

      <form className={styles.stack} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <TextInput
            label="Название"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <TextInput
            label="Цена"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.basePrice.toString()}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, basePrice: Number(e.target.value) }))
            }
          />
          <TextInput
            label="Длительность (мин)"
            type="number"
            min="0"
            value={form.durationMin?.toString() ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                durationMin: e.target.value === "" ? undefined : Number(e.target.value),
              }))
            }
          />
          <label className={styles.selectLabel}>
            <span className={styles.label}>Статус</span>
            <select
              className={styles.select}
              value={form.isActive ? "true" : "false"}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isActive: event.target.value === "true" }))
              }
            >
              <option value="true">Активна</option>
              <option value="false">Неактивна</option>
            </select>
          </label>
        </div>

        <TextInput
          label="Описание"
          value={form.description ?? ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
        />

        {actionError && (
          <div className={styles.alert} style={{ margin: 0 }}>
            <span>{actionError}</span>
          </div>
        )}
        {success && <div className={styles.success}>{success}</div>}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button type="submit" disabled={saving || loading}>
            {saving
              ? "Сохраняем..."
              : isEditing
                ? "Обновить услугу"
                : "Добавить услугу"}
          </Button>
          {isEditing && (
            <Button type="button" variant="ghost" onClick={resetForm} disabled={saving}>
              Отмена
            </Button>
          )}
        </div>
      </form>

      {error && (
        <div className={styles.alert} style={{ marginTop: 12 }}>
          <span>{error}</span>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.simpleTable}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Цена</th>
              <th>Длительность</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedServices.map((service) => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>{service.basePrice}</td>
                <td>{formatMinutes(service.durationMin)}</td>
                <td>{service.isActive ? "Активна" : "Неактивна"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => startEdit(service)}
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => handleDelete(service.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {sortedServices.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 12 }}>
                  Услуги не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
