"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ServiceItem, fetchServices } from "@features/service/api/serviceApi";
import { Button, TextInput } from "@shared/ui";
import { formatMinutes } from "@shared/lib/ui";
import styles from "../../dashboard/dashboard.module.scss";

export function ServicesListSection() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const sortLabel = sortAsc ? "Название А-Я" : "Название Я-А";

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.muted}>Справочник услуг (только просмотр)</p>
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
            </tr>
          </thead>
          <tbody>
            {sortedServices.map((service) => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>{service.basePrice}</td>
                <td>{formatMinutes(service.durationMin)}</td>
                <td>{service.isActive ? "Активна" : "Неактивна"}</td>
              </tr>
            ))}
            {sortedServices.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 12 }}>
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
