import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Inter, Roboto_Mono } from 'next/font/google';
import { Button } from '@/shared/components/Button';
import styles from './layout.module.scss';
import './globals.scss';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

const navLinks = [
  { href: '/#services', label: 'Услуги' },
  { href: '/#process', label: 'Как мы работаем' },
  { href: '/#contact', label: 'Записаться' },
];

export const metadata: Metadata = {
  title: 'Car Service Center | Премиальный автосервис',
  description:
    'Современный автосервис: диагностика, регламентное ТО, ремонт и помощь на дороге. Онлайн-запись, прозрачные сметы и гарантия на работы.',
  icons: {
    icon: '/gear.svg',
    shortcut: '/gear.svg',
    apple: '/gear.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <div className={styles.appShell}>
          <header className={styles.header}>
            <div className="container">
              <div className={styles.headerBar}>
                <Link href="/" className={styles.brand}>
                  <span className={styles.brandMark}>
                    <Image
                      src="/gear.svg"
                      alt="CarService логотип"
                      width={28}
                      height={28}
                      priority
                    />
                  </span>
                  <span>
                    <span className={styles.brandName}>CarService</span>
                    <span className={styles.brandTagline}>
                      Точный сервис и прозрачные сроки ремонта
                    </span>
                  </span>
                </Link>
                <nav className={styles.nav}>
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className={styles.headerActions}>
                  <Button variant="ghost">Цены и услуги</Button>
                  <Button>Онлайн-запись</Button>
                </div>
              </div>
            </div>
          </header>
          <main className={styles.main}>{children}</main>
          <footer className={styles.footer}>
            <div className="container">
              <div className={styles.footerInner}>
                <div className={styles.footerBrand}>
                  <div className={styles.brandMark}>
                    <Image
                      src="/gear.svg"
                      alt="CarService логотип"
                      width={28}
                      height={28}
                    />
                  </div>
                  <div>
                    <div className={styles.brandName}>CarService</div>
                    <div className={styles.footerCopy}>
                      Полный цикл обслуживания: диагностика, ТО, ремонт,
                      подготовка к дальним поездкам и поддержка на дороге.
                    </div>
                  </div>
                </div>
                <div className={styles.footerLinks}>
                  <a href="tel:+74951234567">+7 (495) 123-45-67</a>
                  <a href="mailto:care@carservice.ru">care@carservice.ru</a>
                </div>
                <div className={styles.footerMeta}>
                  <span>График: 9:00 — 20:00, без выходных</span>
                  <span>Таганрог, ул. Чехова, 1</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
