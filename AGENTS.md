# Commerce Web agent instructions

## Repository and boundaries

- Frontend source lives in this independent `vixtruong/commerce-web` repository. The sibling `../Commerce` repository owns backend contracts, authorization, business rules and full-stack Compose integration.
- Browser API requests must go through YARP Gateway. Never call service ports, gRPC, RabbitMQ or databases from React.
- Keep strict TypeScript and explicit API DTOs. Do not use `any`, unchecked casts or EF/domain entities as browser contracts.
- Organize by feature in `src/features`; keep shared controls in `src/components`, shells in `src/layouts`, API transport in `src/api`, permissions/session in `src/auth`, and copy/format/status in `src/lib`.
- Inspect actual backend support before adding an action. Do not present refunds, image uploads, editable profiles, password changes, category assignment or carrier tracking without a supported contract.

## Design direction

- **SkillNest is the primary design reference.** Use its calm mint canvas, white workspace/sidebar, mint product stages, dark emerald accents, restrained icon tiles and monospace metadata. Logbook is a secondary reference for content hierarchy and spacing. DuelSheet is excluded.
- Design layouts around the task. Storefront is product-led: compact search header, real merchandise early, full-width catalog toolbar/grid and a focused purchase panel. Backoffice uses an operational KPI strip, action queues and dense tables/forms. Do not retain an old layout merely to restyle it.
- Keep corners restrained: controls 4px, surfaces 6px, dialogs at most 8px. Only avatars and status dots are circular. Prefer separators and whitespace to nested cards and decorative pills.
- Use semantic tokens in `src/styles/tokens.css` for color, typography, radius, shadow and layout dimensions. Do not add one-off colors or duplicate overrides to reproduce existing tokens.
- `src/styles/index.css` is the stylesheet entry point. Responsibilities are split into `base.css`, `storefront.css`, `commerce.css`, `admin.css` and `responsive.css`. Keep breakpoints together in `responsive.css`.
- Use `--font-display` for strong proportional headings, `--font-mono` for SKU/eyebrow/workspace metadata, and `--font-body` for forms and long content. Prefer local system fonts compatible with offline rendering and the current CSP.
- Use existing Lucide icons, shared `Brand`, `PageHeader`, feedback controls, `Status`, `DataTable`, `Pagination` and `CheckoutSteps`. Extract reusable structure when multiple screens need it; avoid speculative abstractions.
- Avoid fake analytics, discounts, reviews, stock badges or service-health indicators. Counts, prices, availability and workflow states must come from authoritative responses.
- Render Catalog-owned same-origin photos and ordered galleries; identify legacy seed illustrations as samples and provide explicit fallback when a photo fails or is unavailable. Product editors upload up to eight JPEG/PNG/WebP photos through the authorized Catalog API.
- All buttons and links must perform a supported action or navigate to an implemented route. Avoid decorative interactive elements and dead controls.

## State and forms

- Use TanStack Query for server state, authenticated profile, cart and summaries. Keep Zustand limited to UI preferences/navigation state.
- Keep search/filter/sort/pagination in URL parameters using `useListParams`; reset related filters together and reset pagination when a filter changes.
- Use React Hook Form and Zod for validated forms. Preserve field-level errors, server-error mapping, autocomplete and dirty-form warnings.
- Preserve stale data intentionally during list refetches; expose fetching feedback and prevent advancing pagination against a placeholder response.
- Mutations never retry automatically. Disable duplicate submits while pending and keep destructive/consequential actions in the existing confirmation dialogs.
- Keep money in integer cents for calculations and group totals by currency. Use centralized Intl formatters and `lib/status.ts` labels. Filters send original backend enum values even when displayed labels are human-readable.

## Authentication and authorization

- Preserve access tokens in memory, tab-scoped refresh credentials, refresh single-flight, session-generation checks and private-query cancellation/cleanup.
- Permissions are centralized in `src/auth/permissions.ts`. Roles are Identity-managed bundles; navigation, route guards and `Can` use effective permissions.
- Backend policies and authenticated ownership remain authoritative. UI guards must not replace or weaken them.
- Command palette search must derive its results from `visibleNavigation`; it must never reveal or navigate to forbidden workspace areas.
- Preserve safe same-origin sign-in return paths. Password visibility controls must not submit forms, change entered values or log credentials.
- E2E credentials come from ignored `.env.e2e` or `E2E_ENV_FILE`. Never commit credentials, tokens, backend `.env` content or sensitive screenshots/logs.

## Checkout and asynchronous workflows

- Preserve the owner-scoped durable checkout idempotency key and immutable payload saved before submission, including reuse after network failure/remount/session renewal.
- Keep serialized optimistic cart edits, rollback and invalidation behavior.
- `CheckoutSteps` describes page location only. Persisted Saga states own confirmation, fulfilment and compensation progress.
- Do not invent transition timestamps or equate shipment creation with carrier delivery.
- Stop polling on terminal state, error, unmount or timeout; retain explicit resume controls. Only report released stock after compensation completes.
- Clearing the cart after confirmation remains an explicit user action.

## Accessibility and responsive behavior

- Review important screens at **375, 768 and 1440px** with real content, long names/references and loading/error/empty states. No document-level horizontal overflow.
- Preserve keyboard navigation, visible focus, skip link and route focus. Use semantic headings, labeled controls, appropriate button types and `aria-current` for route/step state.
- Touch targets for primary navigation and controls should be at least 44px. Do not rely on color alone to communicate status.
- Use Radix Dialog for overlays/drawers with title, description, Escape handling and focus restoration. Use native disclosure for catalog filters.
- Tables keep a caption, column headers and field labels when displayed as mobile cards. Local horizontal scrolling is permitted within a table container.
- Provide meaningful skeletons, empty states and actionable errors. Keep unsupported data visibly unavailable; avoid unexplained blank panels.
- Respect `prefers-reduced-motion`. Keep text contrast at least 4.5:1 and meaningful controls at least 3:1 against their background.

## Verification and documentation

- Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` after relevant changes; run `pnpm build-storybook` when shared UI/stories change.
- Add behavior tests with Vitest/Testing Library/MSW for new interactions or business rules. Do not write tests that only mirror styling.
- Run Playwright against the real Gateway for navigation, customer checkout, permissions/ownership, admin workflows and responsive review. Preserve existing idempotency/compensation tests.
- Windows shells may need the local `node_modules/.bin` prepended to PATH if the bundled pnpm launcher cannot resolve scripts. Do not edit dependencies or the lockfile to fix a local launcher issue.
- Report checks actually run, failures, service limitations and unverified outcomes. Screenshots complement tests; they do not prove correctness alone.
- Keep Storybook, README, route/API documentation, Docker and CI aligned with actual capabilities. Backend public-contract/workflow changes require the backend's Postman synchronization procedure.
- The research, rollout plan and verification record are in `docs/frontend-redesign-plan.md`.
- Use Conventional Commits grouped by business capability; keep unrelated changes separate.
