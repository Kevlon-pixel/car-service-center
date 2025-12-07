"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@shared/ui";
import {
  UserProfile,
  fetchProfile,
  logoutUser,
  restoreSession,
  ROLE_LABELS,
} from "@features/auth/api/authApi";
import { ServiceRequestsSection } from "./components/ServiceRequestsSection";
import { WorkOrderCreateSection } from "./components/WorkOrderCreateSection";
import { WorkOrderEditSection } from "./components/WorkOrderEditSection";
import { WorkOrdersList } from "./components/WorkOrdersList";
import styles from "../dashboard/dashboard.module.scss";

export default function WorkerDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await restoreSession();
        if (!token) {   
          setError("Сначала войдите как сотрудник.");
          setLoading(false);
          return;
        }
        const me = await fetchProfile();
        setProfile(me);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Не удалось загрузить профиль"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="container">
        <div className={styles.card}>Загружаем профиль…</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container">
        <div className={styles.alert}>
          <span>{error ?? "Не найден профиль пользователя"}</span>
          <Link href="/login">На страницу входа</Link>
        </div>
      </div>
    );
  }

  if (profile.role !== "WORKER") {
    return (
      <div className="container">
        <div className={styles.alert}>
          <span>Этот кабинет доступен только сотрудникам.</span>
          <Link href="/dashboard">Вернуться в личный кабинет</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div>
            <p className={styles.muted}>Кабинет сотрудника</p>
            <h1 style={{ margin: "6px 0 0" }}>
              {profile.name} {profile.surname}
            </h1>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span className={styles.badge}>{ROLE_LABELS[profile.role]}</span>
            <Button onClick={handleLogout} variant="outline">
              Выйти
            </Button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.grid}>
            <div>
              <p className={styles.label}>Email</p>
              <p className={styles.value}>{profile.email}</p>
            </div>
            <div>
              <p className={styles.label}>Телефон</p>
              <p className={styles.value}>{profile.phone}</p>
            </div>
            <div>
              <p className={styles.label}>Создан</p>
              <p className={styles.value}>
                {new Date(profile.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className={styles.label}>Обновлен</p>
              <p className={styles.value}>
                {new Date(profile.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <WorkOrderCreateSection
          profile={profile}
          onCreated={() => setRefreshKey((key) => key + 1)}
        />
        <WorkOrderEditSection
          profile={profile}
          onUpdated={() => setRefreshKey((key) => key + 1)}
        />
        <ServiceRequestsSection reloadKey={refreshKey} />
        <WorkOrdersList reloadKey={refreshKey} />
      </div>
    </div>
  );
}
