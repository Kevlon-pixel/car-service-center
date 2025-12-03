'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@shared/ui';
import { fetchProfile, verifyEmail } from '@features/auth/api/authApi';
import styles from '@features/auth/ui/AuthPage/authPage.module.scss';

type Status = 'pending' | 'success' | 'error';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('pending');
  const [message, setMessage] = useState('Проверяем ссылку из письма...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Не передан токен подтверждения почты');
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        const me = await fetchProfile();
        setStatus('success');
        setMessage('Почта подтверждена. Сейчас перейдем в кабинет.');
        setTimeout(
          () => router.replace(me.role === 'WORKER' ? '/worker' : '/dashboard'),
          1200,
        );
      } catch (err) {
        setStatus('error');
        setMessage(
          err instanceof Error
            ? err.message
            : 'Не удалось подтвердить почту по этой ссылке',
        );
      }
    };

    verify();
  }, [router, searchParams]);

  return (
    <div className="container">
      <div className={styles.authWrapper}>
        <h1 className={styles.title}>Подтверждение почты</h1>
        <p className={styles.subtitle}>
          Это завершающий шаг регистрации. Мы активируем аккаунт и выдадим токены.
        </p>

        <div className={status === 'error' ? styles.error : styles.success}>
          {message}
        </div>

        {status === 'error' && (
          <div className={styles.actions}>
            <Button type="button" onClick={() => router.replace('/login')}>
              Перейти ко входу
            </Button>
            <Link href="/register">Создать новую учетку</Link>
          </div>
        )}
      </div>
    </div>
  );
}
