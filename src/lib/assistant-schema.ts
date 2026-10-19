import { z } from "zod";

export const assistantSettingsSchema = z.object({
  assistant_name: z.string().trim().min(2).max(50),
  assistant_tone: z.enum(["Friendly & Professional", "Professional", "Warm & Casual", "Concise"]),
  assistant_language: z.enum(["English (US)", "English (UK)", "Shona", "Ndebele"]),
  assistant_fallback_message: z.string().trim().min(1).max(200),
  answer_product_questions: z.boolean(),
  provide_business_information: z.boolean(),
  capture_leads: z.boolean(),
  recommend_products: z.boolean(),
  handle_order_inquiries: z.boolean(),
  escalate_to_human: z.boolean(),
});

export type AssistantSettingsInput = z.infer<typeof assistantSettingsSchema>;

export function emptyAssistantSettings(businessName: string): AssistantSettingsInput {
  return {
    assistant_name: `${businessName} Assistant`.slice(0, 50),
    assistant_tone: "Friendly & Professional",
    assistant_language: "English (US)",
    assistant_fallback_message:
      "I'm not sure about that. Let me check with our team and get back to you shortly.",
    answer_product_questions: true,
    provide_business_information: true,
    capture_leads: true,
    recommend_products: true,
    handle_order_inquiries: true,
    escalate_to_human: true,
  };
}
