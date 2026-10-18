import { z } from "zod";

export const inboxMessageSchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["inbound", "outbound"]),
  message_type: z.string(),
  content_text: z.string(),
  delivery_status: z.enum(["received", "queued", "sent", "delivered", "read", "failed"]),
  error_code: z.string(),
  occurred_at: z.string(),
  provider_message_id: z.string().nullable(),
});

export const inboxConversationSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  status: z.enum(["open", "resolved"]),
  handling_mode: z.enum(["ai", "human"]),
  assigned_to: z.string().uuid().nullable(),
  last_message_at: z.string(),
  contact: z.object({ id: z.string().uuid(), wa_id: z.string(), display_name: z.string() }),
  messages: z.array(inboxMessageSchema),
});

export const inboxSchema = z.array(inboxConversationSchema);
export type InboxConversation = z.infer<typeof inboxConversationSchema>;

export const messagePageSchema = z.object({
  items: z.array(inboxMessageSchema),
  has_more: z.boolean(),
});
