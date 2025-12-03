'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Button, TextInput } from '@shared/ui';
import { registerUser } from '@features/auth/api/authApi';
import styles from '@features/auth/ui/AuthPage/authPage.module.scss';

const initialForm = {
  email: '',
  password: '',
  name: '',
  surname: '',
  phone: '',
};

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await registerUser(form);
      setSuccess(response.message ?? 'Проверьте почту для подтверждения');
      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Не удалось создать учетную запись',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className={styles.authWrapper}>
        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.subtitle}>
          Заполните контактные данные. Мы отправим письмо для подтверждения
          почты, без него вход заблокирован.
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <TextInput
            label="Имя"
            placeholder="Иван"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <TextInput
            label="Фамилия"
            placeholder="Иванов"
            required
            value={form.surname}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, surname: e.target.value }))
            }
          />
          <TextInput
            label="Телефон"
            placeholder="+7 (999) 000-00-00"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <TextInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <TextInput
            label="Пароль"
            type="password"
            placeholder="Минимум 6 символов"
            required
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            hint="Пароль хранится в базе в виде хеша"
          />

          <div className={styles.actions}>
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Создаем…' : 'Зарегистрироваться'}
            </Button>
            <Link href="/login">Уже зарегистрированы? Войти</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
