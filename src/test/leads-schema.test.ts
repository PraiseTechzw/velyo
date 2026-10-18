import { describe, expect, it } from "vitest";
import { createLeadSchema, listLeadsSchema, updateLeadSchema } from "@/lib/leads-schema";

describe("lead input validation", () => {
  it("normalizes trimmed names and validates international numbers", () => {
    expect(createLeadSchema.parse({ displayName: "  Tadiwa M  ", phone: "+263771234567", interest: "  Jacket  " })).toEqual({
      displayName: "Tadiwa M",
      phone: "+263771234567",
      interest: "Jacket",
    });
  });

  it("rejects local, malformed, and oversized phone values", () => {
    for (const phone of ["0771234567", "+012345678", "+263 771 234 567", "+26377123456789012"]) {
      expect(createLeadSchema.safeParse({ displayName: "Customer", phone }).success).toBe(false);
    }
  });

  it("accepts only known lead statuses and safe search syntax", () => {
    expect(updateLeadSchema.safeParse({ id: "00000000-0000-4000-8000-000000000001", displayName: "Customer", interest: "Shoes", status: "Qualified" }).success).toBe(true);
    expect(updateLeadSchema.safeParse({ id: "00000000-0000-4000-8000-000000000001", displayName: "Customer", interest: "Shoes", status: "Deleted" }).success).toBe(false);
    expect(listLeadsSchema.safeParse({ query: "x),business_id.eq.other" }).success).toBe(false);
  });
});
