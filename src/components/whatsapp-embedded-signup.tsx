import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Facebook, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWhatsAppSignupConfig, completeWhatsAppSignup } from "@/lib/whatsapp.functions";

type SignupAssets = { phoneNumberId: string; businessAccountId: string };
type FacebookLoginResponse = { authResponse?: { code?: string }; status?: string };
type FacebookSdk = {
  init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: { config_id: string; response_type: "code"; override_default_response_type: true },
  ) => void;
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

const configQuery = {
  queryKey: ["whatsapp-embedded-signup-config"],
  queryFn: () => getWhatsAppSignupConfig(),
};

function waitForSignupAssets(signal: AbortSignal) {
  return new Promise<SignupAssets>((resolve, reject) => {
    const timeout = window.setTimeout(
      () => finish(new Error("Meta signup timed out. Please try again.")),
      120_000,
    );

    function finish(error?: Error, assets?: SignupAssets) {
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      signal.removeEventListener("abort", onAbort);
      if (error) reject(error);
      else if (assets) resolve(assets);
      else reject(new Error("Meta did not return the selected WhatsApp business details."));
    }

    function onAbort() {
      finish(new Error("Meta authorization was cancelled."));
    }

    function onMessage(event: MessageEvent) {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      )
        return;
      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }
      if (!payload || typeof payload !== "object") return;
      const message = payload as { type?: string; event?: string; data?: Record<string, unknown> };
      if (message.type !== "WA_EMBEDDED_SIGNUP") return;
      if (message.event === "CANCEL") {
        finish(new Error("WhatsApp setup was cancelled in Meta."));
        return;
      }
      if (message.event === "ERROR") {
        const detail = message.data?.["error_message"];
        finish(
          new Error(
            typeof detail === "string"
              ? detail.slice(0, 300)
              : "Meta could not complete WhatsApp setup. Review the selected business and try again.",
          ),
        );
        return;
      }
      if (message.event === "FINISH_ONLY_WABA") {
        finish(
          new Error(
            "Meta connected the business account without a phone number. Complete phone number setup in Meta, then reconnect.",
          ),
        );
        return;
      }
      if (message.event !== "FINISH" || !message.data) return;
      const phoneNumberId = message.data["phone_number_id"];
      const businessAccountId = message.data["waba_id"];
      if (
        typeof phoneNumberId !== "string" ||
        !/^\d{5,30}$/.test(phoneNumberId) ||
        typeof businessAccountId !== "string" ||
        !/^\d{5,30}$/.test(businessAccountId)
      ) {
        finish(
          new Error("Meta returned incomplete business details. Please restart the connection."),
        );
        return;
      }
      finish(undefined, { phoneNumberId, businessAccountId });
    }

    window.addEventListener("message", onMessage);
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function WhatsAppEmbeddedSignup({ onManualFallback }: { onManualFallback?: () => void }) {
  const { data, isPending, isError } = useQuery(configQuery);
  const queryClient = useQueryClient();
  const completeSignup = useServerFn(completeWhatsAppSignup);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkLoadFailed, setSdkLoadFailed] = useState(false);
  const [sdkLoadAttempt, setSdkLoadAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!data?.configured) return;
    let cancelled = false;
    setSdkReady(false);
    const initialize = () => {
      if (cancelled || !window.FB) return;
      window.FB.init({
        appId: data.appId,
        cookie: true,
        xfbml: false,
        version: data.graphVersion,
      });
      setSdkReady(true);
    };

    if (window.FB) {
      initialize();
    } else {
      window.fbAsyncInit = initialize;
      document.getElementById("facebook-jssdk")?.remove();
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        script.remove();
        if (!cancelled) {
          setSdkLoadFailed(true);
          onManualFallback?.();
          setError(
            "Your browser could not download Meta’s sign-in library. This is a network or browser blocking issue, not a WhatsApp connection error.",
          );
        }
      };
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
    };
  }, [data, sdkLoadAttempt, onManualFallback]);

  async function connect() {
    if (!window.FB || !data?.configured) return;
    setBusy(true);
    setError("");
    const abortSignup = new AbortController();
    try {
      const assetsPromise = waitForSignupAssets(abortSignup.signal);
      const response = await new Promise<FacebookLoginResponse>((resolve) => {
        window.FB!.login(resolve, {
          config_id: data.configId,
          response_type: "code",
          override_default_response_type: true,
        });
      });
      const code = response.authResponse?.code;
      if (!code) {
        abortSignup.abort();
        await assetsPromise.catch(() => undefined);
        throw new Error("Meta authorization did not complete. Please try again.");
      }
      const assets = await assetsPromise;
      await completeSignup({ data: { code, ...assets } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["whatsapp-connection"] }),
        queryClient.invalidateQueries({ queryKey: ["whatsapp-inbox"] }),
      ]);
    } catch (cause) {
      abortSignup.abort();
      setError(cause instanceof Error ? cause.message : "WhatsApp could not be connected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-gradient-to-r from-[#e8f7ee] via-[#f7fcf9] to-background p-5 md:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[#128C7E] shadow-sm">
            <Facebook className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#128C7E]">
              Secure Meta authorization
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight">Connect WhatsApp Business</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Authorize Veylo with Facebook, select your business and number, and return here to
              finish setup.
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium ${data?.configured && sdkReady ? "text-brand" : "text-muted-foreground"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isError ? "bg-destructive" : data?.configured && sdkReady ? "bg-brand" : "bg-muted-foreground"}`}
          />
          {isPending
            ? "Checking setup"
            : isError
              ? "Setup unavailable"
              : data?.configured
                ? sdkReady
                  ? "Ready to connect"
                  : "Loading Meta"
                : "Setup required"}
        </span>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-3 md:p-6">
        {[
          {
            n: "01",
            title: "Authorize Veylo",
            text: "Sign in to Facebook and approve the requested access.",
          },
          {
            n: "02",
            title: "Choose your account",
            text: "Select the WhatsApp business and phone number to connect.",
          },
          {
            n: "03",
            title: "Return to your inbox",
            text: "Veylo securely completes setup and checks the connection.",
          },
        ].map((step) => (
          <div key={step.n} className="flex gap-3 rounded-xl border bg-muted/20 p-3.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-[11px] font-semibold text-brand">
              {step.n}
            </span>
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 border-t bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="flex items-start gap-2.5 text-xs leading-5 text-muted-foreground">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p>
            Your Facebook password stays with Meta. Veylo receives only the access you approve;
            credentials are exchanged and encrypted server-side.
          </p>
        </div>
        <Button
          onClick={connect}
          disabled={!data?.configured || !sdkReady || busy}
          className="shrink-0"
        >
          {busy ? <LoaderCircle className="animate-spin" /> : <Facebook />}
          {busy
            ? "Connecting…"
            : !data?.configured
              ? "Meta setup required"
              : sdkReady
                ? "Continue with Facebook"
                : "Preparing secure sign-in…"}
          {!busy && data?.configured && sdkReady && <ArrowUpRight />}
        </Button>
      </div>

      {isPending && (
        <p className="border-t px-5 py-3 text-xs text-muted-foreground">
          Checking connection setup…
        </p>
      )}
      {isError && (
        <p role="alert" className="border-t bg-destructive/5 px-5 py-3 text-sm text-destructive">
          Meta connection setup could not be checked. Refresh the page or contact Veylo support.
        </p>
      )}
      {!isPending && !isError && !data?.configured && (
        <div className="border-t bg-amber-50/70 px-5 py-4 text-sm text-amber-950">
          <p className="font-medium">Veylo’s Meta onboarding is still being configured.</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            Customers can use this flow after the platform admin completes Meta app review and
            configures Facebook Login for Business. The advanced manual option below is available
            for developer testing.
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="border-t bg-destructive/5 px-5 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {sdkLoadFailed && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">
            If retrying fails, allow connect.facebook.net in your browser, network, or content
            blocker, then reload this page.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setError("");
              setSdkLoadFailed(false);
              setSdkLoadAttempt((attempt) => attempt + 1);
            }}
          >
            Retry Meta sign-in
          </Button>
        </div>
      )}
      {data?.configured && sdkReady && !error && !busy && (
        <p className="sr-only" role="status">
          Meta sign-in is ready.
        </p>
      )}
    </div>
  );
}
