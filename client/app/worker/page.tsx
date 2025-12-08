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
import { ServicesManageSection } from "./components/ServicesManageSection";
import { SparePartsManageSection } from "./components/SparePartsManageSection";
import styles from "../dashboard/dashboard.module.scss";

export default function WorkerDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSection, setActiveSection] = useState<
    "create" | "edit" | "services" | "parts"
  >("create");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await restoreSession();
        if (!token) {
          setError("Сессия истекла, выполните вход.");
          setLoading(false);
          return;
        }
        const me = await fetchProfile();
        setProfile(me);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Не удалось загрузить профиль",
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
        <div className={styles.card}>Загружаем профиль...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container">
        <div className={styles.alert}>
          <span>{error ?? "Не удалось загрузить профиль"}</span>
          <Link href="/login">Перейти к входу</Link>
        </div>
      </div>
    );
  }

  if (profile.role !== "WORKER") {
    return (
      <div className="container">
        <div className={styles.alert}>
          <span>У вас нет прав для доступа в этот раздел.</span>
          <Link href="/dashboard">Вернуться в кабинет</Link>
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
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, margin: "12px 0 8px" }}>
          <Button
            type="button"
            variant={activeSection === "create" ? "primary" : "outline"}
            onClick={() => setActiveSection("create")}
          >
            Создание заказ-наряда
          </Button>
          <Button
            type="button"
            variant={activeSection === "edit" ? "primary" : "outline"}
            onClick={() => setActiveSection("edit")}
          >
            Редактирование заказ-наряда
          </Button>
          <Button
            type="button"
            variant={activeSection === "services" ? "primary" : "outline"}
            onClick={() => setActiveSection("services")}
          >
            Услуги
          </Button>
          <Button
            type="button"
            variant={activeSection === "parts" ? "primary" : "outline"}
            onClick={() => setActiveSection("parts")}
          >
            Запчасти
          </Button>
        </div>

        {(() => {
          switch (activeSection) {
            case "create":
              return (
                <>
                  <WorkOrderCreateSection
                    profile={profile}
                    onCreated={() => setRefreshKey((key) => key + 1)}
                  />
                  <ServiceRequestsSection reloadKey={refreshKey} />
                </>
              );
            case "edit":
              return (
                <>
                  <WorkOrderEditSection
                    profile={profile}
                    onUpdated={() => setRefreshKey((key) => key + 1)}
                  />
                  <WorkOrdersList reloadKey={refreshKey} />
                </>
              );
            case "services":
              return (
                <ServicesManageSection onChanged={() => setRefreshKey((key) => key + 1)} />
              );
            case "parts":
              return (
                <SparePartsManageSection
                  onChanged={() => setRefreshKey((key) => key + 1)}
                />
              );
            default:
              return null;
          }
        })()}
      </div>
    </div>
  );
}
