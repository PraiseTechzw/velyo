# Veylo

WhatsApp sales and support automation for Zimbabwean businesses.

## Development

Requirements: Bun and Node.js.

```sh
bun install
bun run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the browser client. Server functions also use `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; admin operations require `SUPABASE_SERVICE_ROLE_KEY`. Set `DATABASE_URL` when running Drizzle migrations. Scheduled jobs use `CRON_SECRET` and optionally `CRON_SECRET_PREVIOUS` during secret rotation.

WhatsApp onboarding uses Meta Embedded Signup from Settings. Configure `META_APP_ID`, `META_EMBEDDED_SIGNUP_CONFIG_ID`, `META_WHATSAPP_APP_SECRET`, `WHATSAPP_GRAPH_API_VERSION` (a currently supported `vNN.0` value), `WHATSAPP_TOKEN_ENCRYPTION_KEY` (32 random bytes, base64 encoded), and the webhook variables `META_WHATSAPP_VERIFY_TOKEN` and `META_WHATSAPP_APP_SECRET`. The Facebook Login for Business configuration must request `whatsapp_business_management` and `whatsapp_business_messaging`; Meta App Review and Advanced Access are required before onboarding ordinary customer accounts. The browser receives only the public app/config IDs. Veylo exchanges Meta's authorization code on the server, checks the granted permissions, validates the selected phone and WABA, then encrypts the token before storage. Never place app secrets, service-role credentials, or customer access tokens in `VITE_*` variables. Advanced manual credential entry remains for local testing and assisted setup.

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
