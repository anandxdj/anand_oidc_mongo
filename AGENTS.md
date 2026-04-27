## Learned User Preferences

- Use pnpm for installs and scripts in this workspace, not npm or yarn; see `.cursor/rules/package-manager-pnpm.mdc`.
- When installing Cursor agent skills with `pnpm dlx skills add`, pass **`-y`** so the CLI stays non-interactive (avoids blocking prompts).
- Frontend UI uses **shadcn/ui** (`frontend/components.json`, `frontend/src/components/ui/`). Prefer adding components with `pnpm dlx shadcn@latest add` from `frontend/`; use the **shadcn** MCP in Cursor for registry search and `get_add_command_for_items`. Follow the **shadcn** agent skill in `.agents/skills/shadcn` when building or changing UI (install/update with `pnpm dlx skills add shadcn/ui -y`). See `.cursor/rules/frontend-shadcn-ui.mdc`.

## Learned Workspace Facts

- OIDC signing uses the `node-jose` package, not the panva `jose` library.
- OIDC RSA private key is loaded from `OIDC_RSA_PRIVATE_KEY` or `OIDC_RSA_PRIVATE_KEY_PATH`; in non-production, missing config falls back to an ephemeral RSA key with a console warning.
- Express serves OIDC under `/oauth/*` (with discovery and JWKS as implemented in the backend).
- Consent flow uses a Next.js redirect plus `GET /api/oauth/consent/context` and `POST /api/oauth/consent` with `transaction_id`.
- Admin APIs expect users with `role: "admin"` on the User model; routes are under `/api/admin/*`; OAuth clients are managed under `/api/projects` (e.g. `GET/POST /api/projects`, `GET/POST /api/projects/:projectId/clients`).
- Postman-oriented testing notes live in `backend/POSTMAN_TESTING.md`.
- Backend exposes **`GET /health`** at the API root (not under `/api`) for a quick JSON check of uptime and MongoDB connection state.
- MongoDB is configured with **`MONGODB_URI`** and optional **`MONGODB_DB`** or **`DB_NAME`**; a local MongoDB service for development is defined in `backend/docker-compose.yml`.
- The frontend uses **`NEXT_PUBLIC_API_URL`** when set; otherwise `frontend/src/lib/api.ts` defaults the API base to **`http://localhost:5000`** (for example `POST /api/auth/register`).
