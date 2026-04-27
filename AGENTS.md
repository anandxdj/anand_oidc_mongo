## Learned User Preferences

- Use pnpm for installs and scripts in this workspace, not npm or yarn; see `.cursor/rules/package-manager-pnpm.mdc`.
- When installing Cursor agent skills with `pnpm dlx skills add`, pass **`-y`** so the CLI stays non-interactive (avoids blocking prompts).
- Frontend UI uses **shadcn/ui** (`frontend/components.json`, `frontend/src/components/ui/`). Prefer adding components with `pnpm dlx shadcn@latest add` from `frontend/`; pass **`-y`** so the CLI skips overwrite prompts. Use the **shadcn** MCP in Cursor for registry search and `get_add_command_for_items`. Follow the **shadcn** agent skill in `.agents/skills/shadcn` when building or changing UI (install/update with `pnpm dlx skills add shadcn/ui -y`). See `.cursor/rules/frontend-shadcn-ui.mdc`.
- Marketing landing pages should read as **sleek and professional** (dark premium monochrome): **floating navbar** (not a heavy sticky bar), **Hero Highlight** on the hero headline, **plain shadcn Button** CTAs, and optional **Aceternity** accents only where they add polish (for example a text-flipping-board-style block in the footer).
- For authenticated console flows, use **Sonner toasts** (`toast.success` / `toast.error`) when tasks complete or fail, and **shadcn Empty** (or equivalent empty-state UI) when lists have no items (for example no projects yet).
- Prefer **submit-time or first-attempt validation** for required fields: show required indicators or messages after the user tries to continue or save, rather than always-on clutter on every empty form.

## Learned Workspace Facts

- OIDC signing uses the `node-jose` package, not the panva `jose` library.
- OIDC RSA private key is loaded from `OIDC_RSA_PRIVATE_KEY` or `OIDC_RSA_PRIVATE_KEY_PATH`; in non-production, missing config falls back to an ephemeral RSA key with a console warning.
- Express serves OIDC under `/oauth/*` (with discovery and JWKS as implemented in the backend).
- Consent flow uses a Next.js redirect plus `GET /api/oauth/consent/context` and `POST /api/oauth/consent` with `transaction_id`.
- Admin APIs expect users with `role: "admin"` on the User model; routes are under `/api/admin/*`; the Next.js `/admin` UI should stay **discreet** (no links from public marketing or IdP chrome); OAuth clients are managed under `/api/projects` (e.g. `GET/POST /api/projects`, `GET/POST /api/projects/:projectId/clients`).
- Postman-oriented testing notes live in `backend/POSTMAN_TESTING.md`.
- Backend exposes **`GET /health`** at the API root (not under `/api`) for a quick JSON check of uptime and MongoDB connection state.
- MongoDB is configured with **`MONGODB_URI`** and optional **`MONGODB_DB`** or **`DB_NAME`**; a local MongoDB service for development is defined in `backend/docker-compose.yml`.
- The frontend uses **`NEXT_PUBLIC_API_URL`** when set; otherwise `frontend/src/lib/api.ts` defaults the API base to **`http://localhost:5000`** (for example `POST /api/auth/register`).
- **`frontend/components.json`** registers **`@aceternity`** at `https://ui.aceternity.com/registry/{name}.json`, so Aceternity blocks install via `pnpm dlx shadcn@latest add @aceternity/<component> -y`.
- Public **marketing** home uses **`frontend/src/app/(marketing)/`** with supporting **`marketing-*`** components (top bar, floating nav, footer, and demo sections as implemented).
