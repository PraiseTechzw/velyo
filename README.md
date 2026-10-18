# Veylo

WhatsApp sales and support automation for Zimbabwean businesses.

## Development

Requirements: Bun and Node.js.

```sh
bun install
bun run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the browser client. Server functions also use `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; admin operations require `SUPABASE_SERVICE_ROLE_KEY`. Set `DATABASE_URL` when running Drizzle migrations. Scheduled jobs use `CRON_SECRET` and optionally `CRON_SECRET_PREVIOUS` during secret rotation.

## Commands

```sh
bun run build
bun run preview
bun run lint
bun run test
```

Author: Praise Masunga
