"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, TextInput } from "@shared/ui";
import {
  UserProfile,
  fetchProfile,
  logoutUser,
  restoreSession,
} from "@features/auth/api/authApi";
import {
  Vehicle,
  addMyVehicle,
  fetchMyVehicles,
} from "@features/vehicle/api/vehicleApi";
import styles from "./dashboard.module.scss";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    vin: "",
    licensePlate: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await restoreSession();
        if (!token) {
          setError("Сначала войдите или завершите регистрацию.");
          setLoading(false);
          return;
        }
        const me = await fetchProfile();
        setProfile(me);
        setVehicleLoading(true);
        const myVehicles = await fetchMyVehicles();
        setVehicles(myVehicles);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Не удалось загрузить профиль"
        );
      } finally {
        setLoading(false);
        setVehicleLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
  };

  const handleAddVehicle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVehicleError(null);
    setSaving(true);
    try {
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        year: form.year ? Number(form.year) : undefined,
        vin: form.vin.trim() || undefined,
        licensePlate: form.licensePlate.trim(),
      };
      const created = await addMyVehicle(payload);
      setVehicles((prev) => [created, ...prev]);
      setForm({ make: "", model: "", year: "", vin: "", licensePlate: "" });
    } catch (err) {
      setVehicleError(
        err instanceof Error ? err.message : "Не удалось добавить авто"
      );
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="container">
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div>
            <p className={styles.muted}>Личный кабинет</p>
            <h1 style={{ margin: "6px 0 0" }}>
              {profile.name} {profile.surname}
            </h1>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span className={styles.badge}>{profile.role}</span>
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
              <p className={styles.label}>Подтверждение почты</p>
              <p className={styles.value}>
                {profile.isEmailVerified
                  ? "Подтверждена"
                  : "Ожидает подтверждения"}
              </p>
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

        <div className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.muted}>Ваши автомобили</p>
              <h3 style={{ margin: "4px 0 0" }}>Гараж</h3>
            </div>
            <p className={styles.note}>
              Номер и VIN помогают быстрее находить авто в заказах.
            </p>
          </div>

          <div className={styles.vehicles}>
            <form className={styles.vehicleForm} onSubmit={handleAddVehicle}>
              <div className={styles.formGrid}>
                <TextInput
                  label="Марка"
                  placeholder="Toyota"
                  required
                  value={form.make}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, make: e.target.value }))
                  }
                />
                <TextInput
                  label="Модель"
                  placeholder="Camry"
                  required
                  value={form.model}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, model: e.target.value }))
                  }
                />
                <TextInput
                  label="Год"
                  placeholder="2020"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear().toString()}
                  value={form.year}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, year: e.target.value }))
                  }
                />
                <TextInput
                  label="VIN"
                  placeholder="JH4KA8260MC000000"
                  value={form.vin}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, vin: e.target.value }))
                  }
                />
                <TextInput
                  label="Госномер"
                  placeholder="А123ВС77"
                  required
                  value={form.licensePlate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      licensePlate: e.target.value,
                    }))
                  }
                />
              </div>
              {vehicleError && (
                <div className={styles.alert} style={{ margin: 0 }}>
                  <span>{vehicleError}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button type="submit" disabled={saving}>
                  {saving ? "Сохраняем…" : "Добавить авто"}
                </Button>
              </div>
            </form>

            <div className={styles.vehicleList}>
              {vehicleLoading ? (
                <div className={styles.muted}>Загружаем список…</div>
              ) : vehicles.length === 0 ? (
                <div className={styles.muted}>Пока нет добавленных авто.</div>
              ) : (
                vehicles.map((car) => (
                  <div key={car.id} className={styles.vehicleCard}>
                    <p className={styles.vehicleTitle}>
                      {car.make} {car.model}
                    </p>
                    <div className={styles.vehicleMeta}>
                      {car.year && <span>Год: {car.year}</span>}
                      {car.licensePlate && (
                        <span>Номер: {car.licensePlate}</span>
                      )}
                      {car.vin && <span>VIN: {car.vin}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
