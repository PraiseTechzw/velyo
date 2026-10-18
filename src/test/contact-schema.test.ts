import { describe, expect, it } from "vitest";
import { contactSchema } from "@/lib/contact-schema";

const valid = { name: " Customer ", email: " customer@example.com ", business: "", message: " I have a question. ", website: "" };
describe("Contact question validation", () => {
  it("accepts and trims a prospective customer's question", () => {
    expect(contactSchema.parse(valid)).toEqual({ name: "Customer", email: "customer@example.com", business: "", message: "I have a question.", website: "" });
  });
  it("requires a nonblank name", () => expect(contactSchema.safeParse({ ...valid, name: " " }).success).toBe(false));
  it("requires a valid reply email", () => expect(contactSchema.safeParse({ ...valid, email: "invalid" }).success).toBe(false));
  it("requires a nonblank question", () => expect(contactSchema.safeParse({ ...valid, message: " " }).success).toBe(false));
  it("limits the question to 2000 characters", () => {
    expect(contactSchema.safeParse({ ...valid, message: "a".repeat(2000) }).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, message: "a".repeat(2001) }).success).toBe(false);
  });
  it("rejects the spam trap", () => expect(contactSchema.safeParse({ ...valid, website: "spam.example" }).success).toBe(false));
});