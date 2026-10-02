# Commerce Web agent instructions

- Use strict TypeScript and explicit API contracts; do not use `any` to bypass type checking.
- Keep features responsible for their API types, queries, forms, pages and tests.
- Use TanStack Query for server state. Keep Zustand limited to UI preferences and navigation state.
- Browser requests go through the YARP Gateway only. Never call service ports, gRPC, RabbitMQ or databases.
- The backend repository is `vixtruong/commerce-microservices`; it owns business rules, permission bundles and public contracts.
- Permissions are centralized in `src/auth/permissions.ts`. Route/action guards are UX; backend policies and ownership checks are authoritative.
- Preserve single-flight refresh, session generation checks, private-query cleanup and owner-scoped checkout idempotency.
- Never automatically retry non-idempotent mutations. Saga confirmation and compensation must follow persisted backend states.
- Keep filters/pagination/sorting in URL state. Use React Hook Form and Zod for accessible form validation.
- Preserve the restrained Storefront design, dense backoffice, responsive tables, visible focus and reduced motion.
- Do not add fake analytics, unsupported actions, sample production credentials or internal service URLs.
- Test behavior with Vitest, Testing Library, MSW and Playwright against the real Gateway.
- E2E credentials come from ignored `.env.e2e` or the explicit `E2E_ENV_FILE` path; never commit them.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` after relevant changes.
- Review important screens at 375, 768 and 1440 pixels. Keep Storybook, README, Docker and CI aligned.
- Use Conventional Commits grouped by business capability; keep unrelated changes in separate commits.
