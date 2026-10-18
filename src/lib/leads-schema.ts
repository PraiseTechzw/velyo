import { z } from "zod";

export const leadStatuses = ["New", "Contacted", "Qualified", "Won"] as const;

const searchText = z
  .string()
  .trim()
  .max(100)
  .regex(/^[\p{L}\p{N}\s+@._'-]*$/u, "Search contains unsupported characters.");

export const listLeadsSchema = z.object({
  query: searchText.default(""),
  status: z.enum(["All", ...leadStatuses]).default("All"),
});

export const createLeadSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Enter a phone number in international format, for example +263771234567."),
  interest: z.string().trim().max(200).default(""),
});

export const updateLeadSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().trim().min(2).max(120),
  interest: z.string().trim().max(200),
  status: z.enum(leadStatuses),
});

export const updateLeadStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(leadStatuses),
});

export type LeadStatus = (typeof leadStatuses)[number];
