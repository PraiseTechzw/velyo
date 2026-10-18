import { useState, type FormEvent } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getWhatsAppInbox,
  getWhatsAppMessages,
  sendWhatsAppMessage,
} from "@/lib/whatsapp.functions";

export function WhatsAppChatsPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();
  const sendMessage = useServerFn(sendWhatsAppMessage);
  const inbox = useInfiniteQuery({
    queryKey: ["whatsapp-inbox"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => getWhatsAppInbox({ data: { limit: 50, before: pageParam } }),
    getNextPageParam: (lastPage) =>
      lastPage.length === 50 ? lastPage.at(-1)?.last_message_at : undefined,
  });
  const conversations = inbox.data?.pages.flat() ?? [];
  const rows = conversations.filter((conversation) => {
    const latest = conversation.messages.at(-1)?.content_text ?? "";
    return `${conversation.contact.display_name} ${conversation.contact.wa_id} ${latest}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });
  const current = rows.find((conversation) => conversation.id === selected) ?? rows[0];
  const messagePages = useInfiniteQuery({
    queryKey: ["whatsapp-messages", current?.id],
    enabled: Boolean(current),
    initialPageParam: null as { time: string; id: string } | null,
    queryFn: ({ pageParam }) => {
      if (!current) throw new Error("Select a conversation first.");
      return getWhatsAppMessages({
        data: { conversationId: current.id, limit: 50, before: pageParam },
      });
    },
    getNextPageParam: (page) => {
      const oldest = page.items[0];
      return page.has_more && oldest ? { time: oldest.occurred_at, id: oldest.id } : undefined;
    },
  });
  const messages =
    messagePages.data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.items) ?? [];

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current || !draft.trim()) return;
    setSending(true);
    setSendError("");
    try {
      await sendMessage({ data: { conversationId: current.id, text: draft.trim() } });
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-inbox"] });
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", current.id] });
    } catch (cause) {
      setSendError(cause instanceof Error ? cause.message : "The message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Chats</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Customer conversations received through your connected WhatsApp account.
        </p>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search conversations"
            placeholder="Search name or phone…"
            className="bg-background pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ["whatsapp-inbox"] })}
        >
          Refresh
        </Button>
      </div>

      {inbox.isPending ? (
        <div
          role="status"
          className="rounded-lg border bg-background p-8 text-sm text-muted-foreground"
        >
          Loading conversations…
        </div>
      ) : inbox.isError ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-background p-6">
          <p className="font-medium">Conversations could not be loaded.</p>
          <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
          <Button variant="outline" className="mt-4" onClick={() => void inbox.refetch()}>
            Try again
          </Button>
        </div>
      ) : !rows.length ? (
        <div className="rounded-lg border bg-background p-8">
          <h2 className="font-semibold">
            {query ? "No matching conversations" : "No WhatsApp conversations yet"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {query
              ? "Try another name or phone number."
              : "Once Meta sends a verified message webhook to Veylo, the conversation will appear here. Check Settings for the connection status."}
          </p>
        </div>
      ) : (
        <div className="grid min-h-[560px] overflow-hidden rounded-lg border bg-background lg:grid-cols-[300px_1fr]">
          <div className="border-b lg:border-b-0 lg:border-r" aria-label="Conversation list">
            {rows.map((conversation) => {
              const latest = conversation.messages.at(-1);
              const name = conversation.contact.display_name || conversation.contact.wa_id;
              return (
                <Button
                  key={conversation.id}
                  variant="ghost"
                  onClick={() => setSelected(conversation.id)}
                  className={`h-auto w-full justify-start whitespace-normal rounded-none border-b p-4 text-left ${current?.id === conversation.id ? "bg-panel" : ""}`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                    {name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2">
                      <b className="truncate text-sm">{name}</b>
                      <time className="shrink-0 text-xs text-muted-foreground">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </time>
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {latest?.content_text || `(${latest?.message_type ?? "message"})`}
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
          {current && (
            <section
              className="flex min-w-0 flex-col"
              aria-label={`Conversation with ${current.contact.display_name || current.contact.wa_id}`}
            >
              <header className="border-b p-4">
                <p className="font-semibold">
                  {current.contact.display_name || current.contact.wa_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  +{current.contact.wa_id} ·{" "}
                  {current.handling_mode === "human" ? "Handled by your team" : "AI handling"}
                </p>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6" aria-live="polite">
                {messagePages.hasNextPage && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={messagePages.isFetchingNextPage}
                      onClick={() => void messagePages.fetchNextPage()}
                    >
                      {messagePages.isFetchingNextPage ? "Loading…" : "Load older messages"}
                    </Button>
                  </div>
                )}
                {messagePages.isPending ? (
                  <p role="status" className="text-center text-sm text-muted-foreground">
                    Loading messages…
                  </p>
                ) : messagePages.isError ? (
                  <p role="alert" className="text-center text-sm text-destructive">
                    Messages could not be loaded. Refresh the conversation.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-xl p-3 text-sm sm:max-w-[75%] ${message.direction === "outbound" ? "ml-auto bg-brand-soft" : "bg-panel"}`}
                    >
                      <p className="break-words">
                        {message.content_text || `Unsupported ${message.message_type} message`}
                      </p>
                      <p className="mt-2 flex justify-end gap-2 text-[11px] text-muted-foreground">
                        <time>{new Date(message.occurred_at).toLocaleString()}</time>
                        {message.direction === "outbound" && <span>{message.delivery_status}</span>}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {sendError && (
                <p
                  role="alert"
                  className="mx-4 rounded-md border border-destructive/30 p-3 text-sm text-destructive"
                >
                  {sendError}
                </p>
              )}
              <form onSubmit={submitMessage} className="flex gap-2 border-t p-4">
                <Input
                  aria-label="Message"
                  placeholder="Write a WhatsApp message…"
                  maxLength={4096}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <Button
                  type="submit"
                  aria-label="Send WhatsApp message"
                  disabled={sending || !draft.trim()}
                >
                  {sending ? "Sending…" : <Send />}
                </Button>
              </form>
              <p className="px-4 pb-3 text-xs text-muted-foreground">
                Free-form replies are available within 24 hours of the customer’s last message.
                Outside that window, an approved template is required.
              </p>
            </section>
          )}
        </div>
      )}
      {inbox.hasNextPage && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            disabled={inbox.isFetchingNextPage}
            onClick={() => void inbox.fetchNextPage()}
          >
            {inbox.isFetchingNextPage ? "Loading…" : "Load older conversations"}
          </Button>
        </div>
      )}
    </>
  );
}
