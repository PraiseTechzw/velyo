import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100, "Use 100 characters or fewer."),
  email: z.string().trim().email("Please enter a valid email address.").max(255, "Use 255 characters or fewer."),
  business: z.string().trim().max(150, "Use 150 characters or fewer."),
  message: z.string().trim().min(1, "Please enter your question.").max(2000, "Use 2,000 characters or fewer."),
  website: z.string().max(0, "Unable to send this message."),
});

export type ContactInput = z.infer<typeof contactSchema>;