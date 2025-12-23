'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { fetchProfile, verifyEmail } from '@features/auth/api/authApi';
import { Button } from '@shared/ui';
import styles from '@features/auth/ui/AuthPage/authPage.module.scss';

type Status = 'pending' | 'success' | 'error';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('pending');
  const [message, setMessage] = useState('Verifying your account...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification token not found.');
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        const me = await fetchProfile();
        setStatus('success');
        setMessage('Email verified. Redirecting...');
        setTimeout(
          () => router.replace(me.role === 'WORKER' ? '/worker' : '/dashboard'),
          1200,
        );
      } catch (err) {
        setStatus('error');
        setMessage(
          err instanceof Error
            ? err.message
            : 'Failed to verify email. Please try again.',
        );
      }
    };

    verify();
  }, [router, searchParams]);

  return (
    <div className="container">
      <div className={styles.authWrapper}>
        <h1 className={styles.title}>Email verification</h1>
        <p className={styles.subtitle}>
          We are checking your email. This may take a few seconds.
        </p>

        <div className={status === 'error' ? styles.error : styles.success}>
          {message}
        </div>

        {status === 'error' && (
          <div className={styles.actions}>
            <Button type="button" onClick={() => router.replace('/login')}>
              Back to login
            </Button>
            <Link href="/register">Go to register</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className={styles.authWrapper}>
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
