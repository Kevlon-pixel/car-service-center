'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@shared/ui';
import { fetchProfile, restoreSession } from '@features/auth/api/authApi';
import styles from './home.module.scss';

const services = [
  {
    title: 'Комплексная диагностика',
    description:
      'Подключаем дилерское оборудование, проверяем ходовую, тормоза, электрику и выдаем понятный чек-лист.',
    icon: '01',
  },
  {
    title: 'Плановое ТО и расходники',
    description:
      'Оригинальные масла и фильтры, контроль регламентов, сохраняем гарантию и историю обслуживания.',
    icon: '02',
  },
  {
    title: 'Ремонт подвески и электрики',
    description:
      'От замены рычагов и тормозов до поиска плавающих ошибок ЭБУ — делаем аккуратно и с гарантией.',
    icon: '03',
  },
];

const steps = [
  {
    title: 'Оставляете заявку онлайн',
    description:
      'Перезвоним за 10 минут, уточним симптомы, предложим варианты и согласуем удобное время визита.',
  },
  {
    title: 'Фиксируем смету до начала работ',
    description:
      'Согласуем перечень запчастей, стоимость и сроки, чтобы исключить неожиданные траты и задержки.',
  },
  {
    title: 'Отправляем отчеты по этапам',
    description:
      'Фото и видео из цеха, статус в личном кабинете, согласование допработ только с вашего разрешения.',
  },
];

const stats = [
  { value: '24/7', label: 'Поддержка' },
  { value: '90%', label: 'Работ завершаем в согласованный срок' },
  { value: '3 года+', label: 'Средний опыт мастеров' },
];

export default function Home() {
  const router = useRouter();
  const [ctaMessage, setCtaMessage] = useState<string | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);

  const handleBookClick = async () => {
    setCtaMessage(null);
    setCtaLoading(true);
    try {
      const token = await restoreSession();
      if (!token) {
        router.push('/login');
        return;
      }

      const profile = await fetchProfile();
      if (profile.role === 'USER') {
        router.push('/dashboard');
        return;
      }

      setCtaMessage(
        'Вы вошли как сотрудник или администратор. Для записи на сервис авторизуйтесь как клиент.'
      );
    } catch {
      router.push('/login');
    } finally {
      setCtaLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className="section" id="hero">
        <div className={`container ${styles.hero}`}>
          <div className={styles.heroCopy}>
            <span className="eyebrow">Автосервис</span>
            <h1 className={styles.title}>
              Ухаживаем за вашим автомобилем так, будто он наш
            </h1>
            <p className={styles.lead}>
              Диагностика, ТО и ремонт без очередей. Честные сметы, внимание к
              деталям и персональный мастер, который держит вас в курсе по
              каждому этапу.
            </p>
            <div className={styles.ctaRow}>
              <Button size="lg" onClick={handleBookClick} disabled={ctaLoading}>
                {ctaLoading ? 'Проверяем доступ…' : 'Записаться на сервис'}
              </Button>
              {ctaMessage && <span className={styles.ctaNote}>{ctaMessage}</span>}
            </div>
          </div>
          <div className={styles.heroCard}>
            <div className={styles.heroCardTitle}>
              <div>
                <div className="eyebrow">Персональный мастер — на связи</div>
                <h3 style={{ margin: '8px 0 0' }}>
                  Начнем диагностику в течение 60 минут
                </h3>
              </div>
              <span className={styles.badge}>online</span>
            </div>
            <ul className={styles.checklist}>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Фото и видео отчеты из цеха прямо в мессенджер
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Четкий чек-лист работ и возврат замененных деталей
              </li>
            </ul>
            <div className={styles.stats}>
              {stats.map((item) => (
                <div key={item.label} className={styles.statCard}>
                  <p className={styles.statValue}>{item.value}</p>
                  <p className={styles.statLabel}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="container">
          <span className="eyebrow">Услуги</span>
          <h2 className="sectionTitle">
            Берем на себя всё, чтобы машина ехала мягко и безопасно
          </h2>
          <p className="sectionSubtitle">
            Работаем с легковыми и легкими коммерческими авто. Используем
            сертифицированное оборудование, оригинальные расходники и даем
            прозрачные рекомендации без навязывания.
          </p>
          <div className={styles.servicesGrid}>
            {services.map((service) => (
              <div key={service.title} className={styles.serviceCard}>
                <div className={styles.serviceIcon}>{service.icon}</div>
                <h3 className={styles.serviceTitle}>{service.title}</h3>
                <p className={styles.serviceDesc}>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="process">
        <div className="container">
          <span className="eyebrow">Процесс</span>
          <h2 className="sectionTitle">
            Четкие сроки, контроль качества и связь на каждом этапе
          </h2>
          <p className="sectionSubtitle">
            Соблюдаем технологию производителя, фиксируем все в заказ-наряде и
            предоставляем гарантию на работы и запчасти.
          </p>
          <div className={styles.steps}>
            {steps.map((step, index) => (
              <div key={step.title} className={styles.step}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
