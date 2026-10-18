import { describe, it, expect } from "vitest";
import { businessSchema, emptyBusiness } from "@/lib/business-schema";
describe("Private business configuration", () => {
  const valid = { ...emptyBusiness, display_name: "Praise", name: "Praise Clothing" };
  it("stores business details and AI knowledge", () => {
    const parsed = businessSchema.parse({ ...valid, currency: "USD", products: "Blue dress: $25", faqs: "Delivery to Harare: yes", operating_hours: "Mon–Fri 9–5" });
    expect(parsed.products).toBe("Blue dress: $25");
    expect(parsed.currency).toBe("USD");
  });
  it("does not accept roles or credentials through the public form", () => {
    const parsed = businessSchema.parse({ ...valid, role: "admin", access_token: "secret", owner_id: "another-business" });
    expect(parsed).not.toHaveProperty("role"); expect(parsed).not.toHaveProperty("access_token"); expect(parsed).not.toHaveProperty("owner_id");
  });
});