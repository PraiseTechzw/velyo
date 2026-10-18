# Veylo

WhatsApp sales and support automation for Zimbabwean businesses.

## Development

Requirements: Bun and Node.js.

```sh
bun install
bun run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the browser client. Server functions also use `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; admin operations require `SUPABASE_SERVICE_ROLE_KEY`. Set `DATABASE_URL` when running Drizzle migrations. Scheduled jobs use `CRON_SECRET` and optionally `CRON_SECRET_PREVIOUS` during secret rotation.

WhatsApp Cloud API setup uses the official Meta webhook endpoint at `/api/whatsapp/webhook`. Configure `META_WHATSAPP_VERIFY_TOKEN`, `META_WHATSAPP_APP_SECRET`, `WHATSAPP_GRAPH_API_VERSION` (a currently supported `vNN.0` value), and `WHATSAPP_TOKEN_ENCRYPTION_KEY` (32 random bytes, base64 encoded). The workspace owner enters the Meta Phone Number ID, WhatsApp Business Account ID and system-user token in Settings; Veylo validates the phone and WABA webhook subscription before encrypting the token server-side. Never place these secrets in `VITE_*` variables.

The WhatsApp persistence migration is `drizzle/migrations/0003_whatsapp_messaging.sql`. Apply migrations only to a confirmed development database first. The configured project URL must be checked in Supabase before any database migration is run.

Webhook processing retries are exposed at `POST /api/cron/whatsapp-retries` and require the existing `CRON_SECRET` bearer token. Configure the deployment scheduler to call it periodically after migration `0003` is applied.

## Commands

```sh
bun run build
bun run preview
bun run lint
bun run test
```

Author: Praise Masunga
