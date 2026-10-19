import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { WhatsAppEmbeddedSignup } from "@/components/whatsapp-embedded-signup";
import { PageTitle } from "@/components/dashboard-pages";
import { connectWhatsApp, getWhatsAppConnection } from "@/lib/whatsapp.functions";

export function WhatsAppIntegrationPage() {
  const queryClient = useQueryClient();
  const connection = useQuery({ queryKey: ["whatsapp-connection"], queryFn: () => getWhatsAppConnection() });
  const connect = useServerFn(connectWhatsApp);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const status = connection.data?.status ?? "not connected";

  async function submitConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConnectionError("");
    setConnecting(true);
    try {
      await connect({ data: { phoneNumberId, businessAccountId, accessToken } });
      setAccessToken("");
      setPhoneNumberId("");
      setBusinessAccountId("");
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-connection"] });
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-inbox"] });
    } catch (cause) {
      setConnectionError(cause instanceof Error ? cause.message : "WhatsApp could not be connected.");
    } finally {
      setConnecting(false);
    }
  }

  return <>
    <PageTitle title="WhatsApp Integration" detail="Connect and manage your WhatsApp Business Platform." sample={false}>
      <Button asChild variant="outline"><Link to="/settings">Back to Settings</Link></Button>
    </PageTitle>
            <section
              className="scroll-mt-4 rounded-2xl border bg-background p-5 shadow-sm md:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e8f7ee] text-[#128C7E]">
                    <WhatsAppIcon className="h-7 w-7" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">WhatsApp integration</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Official Meta WhatsApp Business Platform
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium capitalize ${status === "connected" ? "bg-brand-soft text-brand" : connection.isError ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${status === "connected" ? "bg-brand" : connection.isError ? "bg-destructive" : "bg-muted-foreground"}`}
                  />
                  {connection.isPending
                    ? "Checking…"
                    : connection.isError
                      ? "Status unavailable"
                      : status}
                </span>
              </div>
              {(connection.data?.display_phone_number || connection.data?.business_account_id) && (
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  {connection.data.display_phone_number && (
                    <div className="rounded-xl border bg-muted/20 p-3.5">
                      <dt className="text-xs text-muted-foreground">Connected phone number</dt>
                      <dd className="mt-1 text-sm font-medium">
                        {connection.data.display_phone_number}
                      </dd>
                    </div>
                  )}
                  {connection.data.business_account_id && (
                    <div className="rounded-xl border bg-muted/20 p-3.5">
                      <dt className="text-xs text-muted-foreground">WhatsApp business account</dt>
                      <dd className="mt-1 break-all text-sm font-medium">
                        {connection.data.business_account_id}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              {!connection.isPending &&
                !connection.isError &&
                !connection.data?.display_phone_number && (
                  <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No WhatsApp phone number is connected to this workspace yet.
                  </div>
                )}
              {connection.data?.last_error && (
                <p className="mt-3 rounded-md border border-destructive/30 p-3 text-sm text-destructive">
                  {connection.data.last_error}
                </p>
              )}
              {status !== "connected" && status !== "pending" && <WhatsAppEmbeddedSignup />}
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                {connection.isError
                  ? "Connection details could not be checked. Retry loading this page or review the server configuration."
                  : status === "connected"
                    ? "A signed webhook event has been verified. The integration is connected."
                    : status === "pending"
                      ? "Meta accepted the phone and app subscription. Veylo is waiting for the first signed WhatsApp webhook event before marking the connection active."
                      : "Connect your business through Meta. Use advanced manual setup only for testing."}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Webhook health:{" "}
                {connection.data?.verified_at
                  ? `Last verified ${new Date(connection.data.verified_at).toLocaleString()}`
                  : status === "connected"
                    ? "Verification timestamp unavailable"
                    : "No verified webhook event yet"}
              </p>
              <details className="mt-5 rounded-lg border bg-background p-4">
                <summary className="cursor-pointer font-medium">
                  {status === "connected" || status === "pending"
                    ? "Advanced manual setup: replace API credentials"
                    : "Advanced manual setup: enter API credentials"}
                </summary>
                <form onSubmit={submitConnection} className="mt-4 max-w-2xl space-y-4">
                  <p className="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                    Use this only for developer testing or assisted setup. Regular customers should
                    connect with Meta above when Veylo’s Embedded Signup is enabled.
                  </p>
                  <div>
                    <label htmlFor="wa-phone-id" className="mb-2 block text-sm font-medium">
                      Meta Phone Number ID
                    </label>
                    <Input
                      id="wa-phone-id"
                      required
                      maxLength={100}
                      autoComplete="off"
                      value={phoneNumberId}
                      onChange={(event) => setPhoneNumberId(event.target.value)}
                      placeholder="The ID for your WhatsApp business phone"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Find this under your phone number in Meta’s WhatsApp API setup.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="wa-business-id" className="mb-2 block text-sm font-medium">
                      WhatsApp Business Account ID (WABA ID)
                    </label>
                    <Input
                      id="wa-business-id"
                      required
                      maxLength={100}
                      autoComplete="off"
                      value={businessAccountId}
                      onChange={(event) => setBusinessAccountId(event.target.value)}
                      placeholder="The ID for the WhatsApp business account"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      This is the account that owns the WhatsApp phone number.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="wa-access-token" className="mb-2 block text-sm font-medium">
                      Meta system-user access token
                    </label>
                    <Input
                      id="wa-access-token"
                      required
                      type="password"
                      autoComplete="new-password"
                      maxLength={5000}
                      value={accessToken}
                      onChange={(event) => setAccessToken(event.target.value)}
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Create this in Meta Business Settings for a system user with WhatsApp
                      permissions. Never share it in a support message.
                    </p>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    The token is sent to the server over HTTPS, encrypted before storage, and never
                    displayed again. It is not written to browser storage or application logs.
                  </p>
                  {connectionError && (
                    <p role="alert" className="text-sm text-destructive">
                      {connectionError}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={connecting || !phoneNumberId || !businessAccountId || !accessToken}
                  >
                    {connecting ? "Checking details with Meta…" : "Verify and connect WhatsApp"}
                  </Button>
                </form>
              </details>
              <NotReady>
                Message template management and fine-grained Meta permission diagnostics are not yet
                available in this workspace.
              </NotReady>
            </section>

  </>;
}
