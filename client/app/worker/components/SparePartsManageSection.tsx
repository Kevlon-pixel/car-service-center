import { useEffect, useMemo, useState } from "react";

import {
  SparePartInput,
  SparePartItem,
  createSparePart,
  deleteSparePart,
  fetchSpareParts,
  updateSparePart,
} from "@features/spare-part/api/sparePartApi";
import { Button, TextInput } from "@shared/ui";
import styles from "../../dashboard/dashboard.module.scss";

interface SparePartsManageSectionProps {
  onChanged?: () => void;
}

export function SparePartsManageSection({ onChanged }: SparePartsManageSectionProps) {
  const [parts, setParts] = useState<SparePartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SparePartInput>({
    name: "",
    article: "",
    unit: "",
    price: 0,
    stockQuantity: 0,
    isActive: true,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSpareParts(search.trim() || undefined, true);
      setParts(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось загрузить запчасти",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredParts = useMemo(() => {
    const sorted = [...parts].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    return sorted;
  }, [parts]);

  const resetForm = () => {
    setEditId(null);
    setForm({
      name: "",
      article: "",
      unit: "",
      price: 0,
      stockQuantity: 0,
      isActive: true,
    });
    setActionError(null);
    setSuccess(null);
  };

  const startEdit = (part: SparePartItem) => {
    setEditId(part.id);
    setForm({
      name: part.name,
      article: part.article,
      unit: part.unit,
      price: Number(part.price),
      stockQuantity: part.stockQuantity,
      isActive: part.isActive,
    });
    setActionError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setActionError(null);
    setSuccess(null);
    try {
      if (editId) {
        const updated = await updateSparePart(editId, form);
        setParts((prev) => prev.map((p) => (p.id === editId ? updated : p)));
        setSuccess("Запчасть обновлена.");
      } else {
        const created = await createSparePart(form);
        setParts((prev) => [...prev, created]);
        setSuccess("Запчасть добавлена.");
      }
      onChanged?.();
      resetForm();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось сохранить запчасть",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await deleteSparePart(id);
      setParts((prev) => prev.filter((p) => p.id !== id));
      onChanged?.();
      if (editId === id) {
        resetForm();
      }
      setSuccess("Запчасть удалена.");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось удалить запчасть",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.muted}>Управление запчастями</p>
          <h3 style={{ margin: "4px 0 0" }}>Запчасти</h3>
        </div>
        <div
          className={styles.filters}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "nowrap",
          }}
        >
          <div style={{ minWidth: 260, maxWidth: 360, width: "100%" }}>
            <TextInput
              label="Поиск по имени или артикулу"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  load();
                }
              }}
            />
          </div>
          <Button type="button" variant="ghost" onClick={load} disabled={loading}>
            Обновить
          </Button>
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
            label="Артикул"
            required
            value={form.article}
            onChange={(e) => setForm((prev) => ({ ...prev, article: e.target.value }))}
          />
          <TextInput
            label="Ед. измерения"
            required
            value={form.unit}
            onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
          />
          <TextInput
            label="Цена"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price.toString()}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, price: Number(e.target.value) }))
            }
          />
          <TextInput
            label="Остаток на складе"
            type="number"
            min="0"
            required
            value={form.stockQuantity.toString()}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, stockQuantity: Number(e.target.value) }))
            }
          />
          <label className={styles.selectLabel}>
            <span className={styles.label}>Доступна</span>
            <select
              className={styles.select}
              value={form.isActive ? "true" : "false"}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isActive: event.target.value === "true" }))
              }
            >
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          </label>
        </div>

        {actionError && (
          <div className={styles.alert} style={{ margin: 0 }}>
            <span>{actionError}</span>
          </div>
        )}
        {success && <div className={styles.success}>{success}</div>}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button type="submit" disabled={saving || loading}>
            {saving ? "Сохраняем..." : editId ? "Сохранить изменения" : "Добавить запчасть"}
          </Button>
          {editId && (
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
              <th>Артикул</th>
              <th>Ед.</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Доступна</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredParts.map((part) => (
              <tr key={part.id}>
                <td>{part.name}</td>
                <td>{part.article}</td>
                <td>{part.unit}</td>
                <td>{part.price}</td>
                <td>{part.stockQuantity}</td>
                <td>{part.isActive ? "Да" : "Нет"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => startEdit(part)}
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => handleDelete(part.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {filteredParts.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 12 }}>
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
