'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button, TextInput } from '@shared/ui';
import { fetchProfile, loginUser } from '@features/auth/api/authApi';
import styles from '@features/auth/ui/AuthPage/authPage.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginUser(form);
      const me = await fetchProfile();
      const target = me.role === 'WORKER' ? '/worker' : '/dashboard';
      router.replace(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className={styles.authWrapper}>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.subtitle}>
          Используйте почту и пароль, указанные при регистрации. После входа мы
          сразу проверим, что токены работают, и откроем панель.
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
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
            placeholder="••••••"
            required
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />

          <div className={styles.actions}>
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Входим…' : 'Войти'}
            </Button>
            <Link href="/register">Нет аккаунта? Регистрация</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
