"use client";

import { useEffect, useState } from "react";

import {
  SystemRole,
  UserSortOption,
  UserStatusFilter,
  UserSummary,
  USER_STATUS_OPTIONS,
  fetchUsers,
  updateUserRole,
} from "@features/user/api/userApi";
import { Button, TextInput } from "@shared/ui";
import styles from "../../dashboard/dashboard.module.scss";

const statusOptions: Array<{
  value: UserStatusFilter | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "Все статусы" },
  ...USER_STATUS_OPTIONS,
];

const sortOptions: Array<{ value: UserSortOption; label: string }> = [
  { value: "surname-asc", label: "Фамилия А–Я" },
  { value: "surname-desc", label: "Фамилия Я–А" },
];

const roleOptions: Array<{ value: SystemRole; label: string }> = [
  { value: "ADMIN", label: "Администратор" },
  { value: "WORKER", label: "Сотрудник" },
  { value: "USER", label: "Клиент" },
];

interface UsersListSectionProps {
  reloadKey?: number;
}

export function UsersListSection({ reloadKey }: UsersListSectionProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [status, setStatus] = useState<UserStatusFilter | "ALL">("ALL");
  const [sort, setSort] = useState<UserSortOption>("surname-asc");
  const [search, setSearch] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = await fetchUsers({
        status: status === "ALL" ? undefined : status,
        sort,
        search: appliedSearch || undefined,
      });
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить список пользователей",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [status, sort, appliedSearch, reloadKey]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedSearch(search.trim());
  };

  const handleRoleChange = async (userId: string, role: SystemRole) => {
    setUpdatingId(userId);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateUserRole(userId, role);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, ...updated } : user,
        ),
      );
      setMessage("Роль обновлена");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось обновить роль пользователя",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.muted}>Управление пользователями</p>
          <h3 style={{ margin: "4px 0 0" }}>Список пользователей</h3>
        </div>

        <div
          className={styles.filters}
          style={{ alignItems: "flex-end", width: "100%", gap: 12 }}
        >
          <label className={styles.selectLabel}>
            <span className={styles.label}>Статус</span>
            <select
              className={styles.select}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as UserStatusFilter | "ALL")
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
                setSort(event.target.value as UserSortOption)
              }
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <form
            onSubmit={handleSearch}
            style={{
              display: "grid",
              gridTemplateColumns: appliedSearch
                ? "minmax(260px, 1fr) auto auto"
                : "minmax(260px, 1fr) auto",
              gap: 12,
              alignItems: "end",
              flex: 1,
            }}
          >
            <div style={{ width: "100%", maxWidth: 420 }}>
              <TextInput
                label="Поиск по фамилии"
                placeholder="Введите фамилию"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" disabled={loading}>
              Найти
            </Button>
            {appliedSearch && (
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={() => {
                  setSearch("");
                  setAppliedSearch("");
                }}
              >
                Сбросить
              </Button>
            )}
          </form>

          <div style={{ marginLeft: "auto" }}>
            <Button
              type="button"
              variant="ghost"
              onClick={loadUsers}
              disabled={loading}
            >
              Обновить
            </Button>
          </div>
        </div>
      </div>

      {message && (
        <div className={styles.success} style={{ margin: 0 }}>
          {message}
        </div>
      )}

      {error && (
        <div className={styles.alert} style={{ margin: 0 }}>
          <span>{error}</span>
          <Button type="button" variant="outline" size="md" onClick={loadUsers}>
            Повторить
          </Button>
        </div>
      )}

      {loading ? (
        <div className={styles.muted}>Загрузка пользователей...</div>
      ) : users.length === 0 ? (
        <div className={styles.muted}>Пользователи не найдены.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <div className={styles.tableTitle}>Пользователи</div>
          <table className={styles.simpleTable}>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Телефон</th>
                <th>Роль</th>
                <th>Статус почты</th>
                <th>Дата регистрации</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>
                      {user.name} {user.surname}
                    </div>
                    <div className={styles.muted}>{user.email}</div>
                  </td>
                  <td>{user.phone}</td>
                  <td>
                    <select
                      className={styles.select}
                      value={user.role}
                      disabled={updatingId === user.id}
                      onChange={(event) =>
                        handleRoleChange(
                          user.id,
                          event.target.value as SystemRole,
                        )
                      }
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        user.isEmailVerified
                          ? styles.statusConfirmed
                          : styles.statusCancelled
                      }`}
                    >
                      {user.isEmailVerified
                        ? "Подтвержден"
                        : "Не подтвержден"}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
