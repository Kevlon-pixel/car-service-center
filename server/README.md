# Car Service Center API

NestJS API с Prisma и Swagger. Находится в каталоге `server/` монорепозитория.

## Подготовка
- Скопируйте `.env.example` в `.env` и заполните базы, JWT секреты и SMTP настройки.
- Установите зависимости: `npm install`.

## Основные команды
- `npm run dev` — запуск в watch-режиме.
- `npm run debug` — запуск с инспектором.
- `npm run build` — сборка в `dist/`.
- `npm run lint` — ESLint для `src/`.
- `npm run format` — форматирование через Prettier.

## Prisma
Работайте из каталога `server/`:
- `npx prisma migrate dev` — применить миграции.
- `npx prisma generate` — сгенерировать Prisma Client.
- `npx prisma studio` — открыть Prisma Studio.

Документация API доступна по адресу `http://localhost:<PORT>/api` после запуска сервера (`PORT` берётся из `.env`, по умолчанию `3000`).
