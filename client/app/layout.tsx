import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Inter, Roboto_Mono } from 'next/font/google';
import { HeaderAuth } from '@widgets/header/ui/HeaderAuth/HeaderAuth';
import styles from './app-shell.module.scss';
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
  { href: '/#contact', label: 'Контакты' },
];

export const metadata: Metadata = {
  title: 'Car Service Center | Автосервис и ремонт',
  description:
    'Автосервис полного цикла: диагностика, обслуживание и ремонт автомобиля. Онлайн-запись, прозрачные сроки и поддержка на каждом этапе.',
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
                      Онлайн-запись и сопровождение вашего авто в одном месте
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
                  <HeaderAuth />
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
                      подбор запчастей и консультации по уходу за авто.
                    </div>
                  </div>
                </div>
                <div className={styles.footerLinks}>
                  <a href="tel:+74951234567">+7 (495) 123-45-67</a>
                  <a href="mailto:care@carservice.ru">care@carservice.ru</a>
                </div>
                <div className={styles.footerMeta}>
                  <span>График: 9:00 – 20:00, без выходных</span>
                  <span>Москва, ул. Пример, 1</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
