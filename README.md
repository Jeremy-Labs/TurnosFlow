# TurnosFlow

SaaS multiempresa para que pequeños y medianos negocios gestionen sus turnos y reciban reservas online.

## Features

- Dashboard privado por negocio con control de acceso por membresías.
- Servicios, profesionales y horarios semanales.
- Página pública `/b/[slug]` con flujo de reserva mobile-first.
- Motor de disponibilidad calculado en servidor.
- Citas con estados `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` y `NO_SHOW`.
- Aislamiento multi-tenant explícito en todas las consultas privadas.
- Seed de demo para Barbería Central.

## Architecture

Monolito modular Next.js App Router. Prisma usa PostgreSQL como base oficial. El dominio de disponibilidad no depende de React ni de Prisma y puede probarse de forma aislada. Ver [docs/architecture.md](docs/architecture.md).

## Tech Stack

Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Auth.js, Zod, Vitest y Playwright.

## Local Development

Requisitos: Node.js 20+, npm y Docker Desktop para PostgreSQL.

```bash
npm install
Copy-Item .env.example .env
docker compose up -d db
npm run db:push
npm run db:seed
npm run dev
```

Abrir `http://localhost:3000`. La demo pública está en `http://localhost:3000/b/barberia-central`.

## Database

```bash
npm run db:studio
npm run db:reset
```

Todos los timestamps se guardan en UTC; `Business.timezone` define la interpretación de horarios locales.

## Tests

```bash
npm test
npm run test:e2e
npm run lint
npm run build
```

Los tests unitarios cubren slots, superposición, validaciones, permisos y timezone. Playwright cubre el recorrido público principal cuando la base y el servidor están disponibles.

## Demo data

El seed crea el negocio `Barbería Central`, propietario demo, servicios, profesionales, clientes y citas de ejemplo.

## Roadmap

Excepciones de disponibilidad, autenticación completa con proveedores, notificaciones, pagos, integraciones de calendario, sucursales e i18n quedan fuera del MVP inicial.
