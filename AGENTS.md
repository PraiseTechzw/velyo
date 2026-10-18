<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Contact submissions use a shared Zod schema and an insert-only public server function; no visitor can read questions, keeping prospect details private.
- Landing-page contact and FAQ sections live in focused components using the existing UI controls to keep the page maintainable.
- Account routes live under the client-only authenticated layout; protected server functions validate the bearer separately so direct requests remain secure.
- Business creation and owner membership use an atomic database function; RLS isolates businesses and blocks client role writes and credential reads.
- One root auth subscriber updates session-driven navigation and query invalidation; sign-out cancels and clears account queries before clearing the session.
- Onboarding and account editing share a validated business form and schema so saved configuration follows one contract.
- Dashboard destinations share DashboardShell for fixed navigation and account identity; each destination has its own authenticated route and head metadata.
- Unconnected commerce views use explicitly marked sample data and never present local interactions as delivered messages or saved business records.
