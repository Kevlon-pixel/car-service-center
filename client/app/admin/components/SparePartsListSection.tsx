"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SparePartItem, fetchSpareParts } from "@features/spare-part/api/sparePartApi";
import { Button, TextInput } from "@shared/ui";
import styles from "../../dashboard/dashboard.module.scss";

export function SparePartsListSection() {
  const [parts, setParts] = useState<SparePartItem[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSpareParts(appliedSearch.trim() || undefined, true);
      setParts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить запчасти");
    } finally {
      setLoading(false);
    }
  }, [appliedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedParts = useMemo(() => {
    const sorted = [...parts].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    return sortAsc ? sorted : sorted.reverse();
  }, [parts, sortAsc]);

  const sortLabel = sortAsc ? "Название А-Я" : "Название Я-А";

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.muted}>Справочник запчастей (только просмотр)</p>
          <h3 style={{ margin: "4px 0 0" }}>Запчасти</h3>
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
                label="Поиск по названию или артикулу"
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
              <th>Артикул</th>
              <th>Ед.</th>
              <th>Цена</th>
              <th>Статус</th>
              <th>Остаток</th>
            </tr>
          </thead>
          <tbody>
            {sortedParts.map((part) => (
              <tr key={part.id}>
                <td>{part.name}</td>
                <td>{part.article}</td>
                <td>{part.unit}</td>
                <td>{part.price}</td>
                <td>{part.isActive ? "Активна" : "Неактивна"}</td>
                <td>{part.stockQuantity}</td>
              </tr>
            ))}
            {sortedParts.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 12 }}>
                  Запчасти не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
