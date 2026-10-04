# Project: UMKM Digital Platform
Monorepo: Next.js (apps/web) + NestJS (apps/api) + shared packages.
Stack: TypeScript, Tailwind, shadcn/ui, Prisma, PostgreSQL.

## Architecture rules
- All business logic (pricing, rules, AI orchestration) lives in apps/api (NestJS).
- apps/web is only rendering + calling API. No business logic in Next.js.
- AI NEVER determines price or valid features. Prices come from planner-engine rules.
- Reusable UI components in packages/core-frontend use config-driven rendering (no hardcoded client data).

## Workflow rules
- Write Prisma schema + migration before touching code that needs new data.
- Add tests for planner-engine (Vitest) when pricing/feature logic changes.
- Small commits, conventional commit messages.