"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import buttonStyles from '@shared/ui/Button/Button.module.scss';
import {
  UserProfile,
  fetchProfile,
  logoutUser,
  restoreSession,
} from '@features/auth/api/authApi';
import { AUTH_EVENT } from '@features/auth/lib/session';

export function HeaderAuth() {
  const router = useRouter();
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'guest' } | { status: 'user'; user: UserProfile }
  >({ status: 'loading' });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const token = await restoreSession();
        if (!token) {
          if (mounted) setState({ status: 'guest' });
          return;
        }
        const profile = await fetchProfile();
        if (mounted) setState({ status: 'user', user: profile });
      } catch {
        if (mounted) setState({ status: 'guest' });
      }
    };

    load();
    const listener = () => load();
    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_EVENT, listener);
    }
    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener(AUTH_EVENT, listener);
      }
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setState({ status: 'guest' });
    router.push('/login');
  };

  if (state.status === 'loading') {
    return null;
  }

  if (state.status === 'user') {
    const isWorker = state.user.role === 'WORKER';
    const isAdmin = state.user.role === 'ADMIN';
    const dashboardHref = isWorker ? '/worker' : isAdmin ? '/admin' : '/dashboard';
    const dashboardLabel = isWorker
      ? 'Кабинет сотрудника'
      : isAdmin
        ? 'Панель администратора'
        : 'Личный кабинет';

    return (
      <>
        <Link
          href={dashboardHref}
          className={`${buttonStyles.button} ${buttonStyles.ghost} ${buttonStyles.md}`}
        >
          {dashboardLabel}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={`${buttonStyles.button} ${buttonStyles.outline} ${buttonStyles.md}`}
        >
          Выйти
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className={`${buttonStyles.button} ${buttonStyles.ghost} ${buttonStyles.md}`}
      >
        Войти
      </Link>
      <Link
        href="/register"
        className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.md}`}
      >
        Зарегистрироваться
      </Link>
    </>
  );
}
