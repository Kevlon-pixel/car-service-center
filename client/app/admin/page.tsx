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
import { WorkOrdersList } from "../worker/components/WorkOrdersList";
import { UsersListSection } from "./components/UsersListSection";
import { ServicesListSection } from "./components/ServicesListSection";
import { SparePartsListSection } from "./components/SparePartsListSection";
import { ReportsSection } from "./components/ReportsSection";
import styles from "../dashboard/dashboard.module.scss";

type SectionKey = "requests" | "orders" | "services" | "parts" | "users" | "reports";

const sections: Array<{ key: SectionKey; label: string }> = [
  { key: "requests", label: "Заявки" },
  { key: "orders", label: "Заказ-наряды" },
  { key: "services", label: "Услуги (просмотр)" },
  { key: "parts", label: "Запчасти (просмотр)" },
  { key: "users", label: "Пользователи" },
  { key: "reports", label: "Отчеты" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
              return <ServiceRequestsSection />;
            case "orders":
              return <WorkOrdersList />;
            case "services":
              return <ServicesListSection />;
            case "parts":
              return <SparePartsListSection />;
            case "users":
              return <UsersListSection />;
            case "reports":
              return <ReportsSection />;
            default:
              return null;
          }
        })()}
      </div>
    </div>
  );
}
