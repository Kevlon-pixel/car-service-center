"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  UserProfile,
  fetchProfile,
  logoutUser,
  restoreSession,
  ROLE_LABELS,
} from "@features/auth/api/authApi";
import { Button } from "@shared/ui";
import { ServiceRequestsSection } from "../worker/components/ServiceRequestsSection";
import { ServicesManageSection } from "../worker/components/ServicesManageSection";
import { SparePartsManageSection } from "../worker/components/SparePartsManageSection";
import { WorkOrderCreateSection } from "../worker/components/WorkOrderCreateSection";
import { WorkOrderEditSection } from "../worker/components/WorkOrderEditSection";
import { WorkOrdersList } from "../worker/components/WorkOrdersList";
import { UsersListSection } from "./components/UsersListSection";
import styles from "../dashboard/dashboard.module.scss";

type SectionKey = "requests" | "orders" | "services" | "parts" | "users";

const sections: Array<{ key: SectionKey; label: string }> = [
  { key: "requests", label: "Заявки и создание" },
  { key: "orders", label: "Заказ-наряды" },
  { key: "services", label: "Услуги" },
  { key: "parts", label: "Запчасти" },
  { key: "users", label: "Пользователи" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionKey>("requests");

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
        if (me.role === "WORKER") {
          router.replace("/worker");
        }
        if (me.role === "USER") {
          router.replace("/dashboard");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить профиль");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

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

  if (profile.role !== "ADMIN") {
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
            <p className={styles.muted}>Кабинет администратора</p>
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

        <div style={{ display: "flex", gap: 12, margin: "12px 0 8px", flexWrap: "wrap" }}>
          {sections.map((section) => (
            <Button
              key={section.key}
              type="button"
              variant={activeSection === section.key ? "primary" : "outline"}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </Button>
          ))}
        </div>

        {(() => {
          switch (activeSection) {
            case "requests":
              return (
                <>
                  <WorkOrderCreateSection
                    profile={profile}
                    onCreated={() => setRefreshKey((key) => key + 1)}
                  />
                  <ServiceRequestsSection reloadKey={refreshKey} />
                </>
              );
            case "orders":
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
            case "users":
              return <UsersListSection reloadKey={refreshKey} />;
            default:
              return null;
          }
        })()}
      </div>
    </div>
  );
}
