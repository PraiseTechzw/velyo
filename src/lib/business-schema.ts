import { z } from "zod";
export const businessSchema = z.object({
  display_name: z.string().trim().min(2).max(120),
  avatar_url: z.union([z.literal(""), z.string().url().startsWith("https://")]),
  name: z.string().trim().min(2).max(120), industry: z.string().max(120),
  description: z.string().max(4000), address: z.string().max(1000),
  contact_email: z.union([z.literal(""), z.string().email()]), contact_phone: z.string().max(50),
  operating_hours: z.string().max(1000), currency: z.enum(["USD", "ZWG", "ZAR", "EUR", "GBP"]),
  language: z.enum(["English", "Shona", "Ndebele"]), notifications: z.boolean(),
  products: z.string().max(20000), faqs: z.string().max(20000), delivery_policy: z.string().max(4000), ai_instructions: z.string().max(10000),
  whatsapp_phone_number_id: z.string().max(100), whatsapp_business_account_id: z.string().max(100),
});
export type BusinessInput = z.infer<typeof businessSchema>;
export const emptyBusiness: BusinessInput = { display_name: "", avatar_url: "", name: "", industry: "", description: "", address: "", contact_email: "", contact_phone: "", operating_hours: "", currency: "USD", language: "English", notifications: true, products: "", faqs: "", delivery_policy: "", ai_instructions: "", whatsapp_phone_number_id: "", whatsapp_business_account_id: "" };