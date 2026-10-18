import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/integrations/supabase/types";
import { createLeadSchema, listLeadsSchema, updateLeadSchema, updateLeadStatusSchema } from "@/lib/leads-schema";
import { createLeadForOwner, getLeadsForOwner, updateLeadForOwner, updateLeadStatusForOwner } from "@/lib/leads-store.server";

type Result = { data: unknown; count: number | null; error: { code: string } | null };
type Query = {
  select: (...args: unknown[]) => Query;
  eq: (field: string, value: unknown) => Query;
  order: (...args: unknown[]) => Query;
  limit: (value: number) => Query;
  or: (value: string) => Query;
  upsert: (value: Record<string, unknown>) => Query;
  update: (value: Record<string, unknown>) => Query;
  single: () => Promise<Result>;
  maybeSingle: () => Promise<Result>;
  then: Promise<Result>["then"];
};

function fakeDb(options: { failTable?: string; businessId?: string; leads?: unknown[] } = {}) {
  const calls: Array<{ table: string; operations: Array<[string, ...unknown[]]> }> = [];
  const client = {
    from(table: string) {
      const record = { table, operations: [] as Array<[string, ...unknown[]]> };
      calls.push(record);
      const q: Query = {
        select: (...args) => { record.operations.push(["select", ...args]); return q; },
        eq: (field, value) => { record.operations.push(["eq", field, value]); return q; },
        order: (...args) => { record.operations.push(["order", ...args]); return q; },
        limit: (value) => { record.operations.push(["limit", value]); return q; },
        or: (value) => { record.operations.push(["or", value]); return q; },
        upsert: (value) => { record.operations.push(["upsert", value]); return q; },
        update: (value) => { record.operations.push(["update", value]); return q; },
        single: async () => result(),
        maybeSingle: async () => result(),
        then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
      };
      function result(): Result {
        if (options.failTable === table) return { data: null, count: null, error: { code: "DB_ERROR" } };
        if (table === "businesses") return { data: { id: options.businessId ?? "workspace-a" }, count: null, error: null };
        const select = record.operations.find(([name]) => name === "select")?.[2] as { head?: boolean } | undefined;
        if (select && typeof select === "object" && select.head) {
          const stage = record.operations.find(([name, field]) => name === "eq" && field === "lead_status")?.[2];
          return { data: null, count: stage === "Won" ? 1 : stage === "Qualified" ? 2 : 4, error: null };
        }
        if (record.operations.some(([name]) => name === "upsert" || name === "update"))
          return { data: { id: "00000000-0000-4000-8000-000000000001" }, count: null, error: null };
        return { data: options.leads ?? [], count: null, error: null };
      }
      return q;
    },
  };
  return { db: client as unknown as SupabaseClient<Database>, calls };
}

describe("workspace lead persistence", () => {
  it("resolves the workspace from the authenticated owner id", async () => {
    const { db, calls } = fakeDb({ businessId: "workspace-a" });

    await expect(getLeadsForOwner(db, "user-a", listLeadsSchema.parse({}))).resolves.toMatchObject({ total: 4 });
    expect(calls[0]?.operations).toContainEqual(["eq", "owner_id", "user-a"]);
  });

  it("keeps list, status counts and lead creation within the resolved workspace", async () => {
    const { db, calls } = fakeDb({ leads: [{ id: "lead-a" }] });
    const query = listLeadsSchema.parse({ query: "Ava", status: "Qualified" });
    const result = await getLeadsForOwner(db, "user-a", query);

    expect(result.leads).toEqual([{ id: "lead-a" }]);
    expect(result.byStatus.Qualified).toBe(2);
    expect(calls.filter(({ table }) => table === "contacts").every(({ operations }) =>
      operations.some(([name, field, value]) => name === "eq" && field === "business_id" && value === "workspace-a"),
    )).toBe(true);

    const created = await createLeadForOwner(db, "user-a", createLeadSchema.parse({ displayName: "Ava", phone: "+263771234567", interest: "Shoes" }));
    expect(created.id).toBe("00000000-0000-4000-8000-000000000001");
    const upsert = calls.at(-1)?.operations.find(([name]) => name === "upsert")?.[1] as Record<string, unknown>;
    expect(upsert).toMatchObject({ business_id: "workspace-a", wa_id: "263771234567", is_lead: true });
  });

  it("scopes edits by both workspace and lead id, and reports database failures", async () => {
    const { db, calls } = fakeDb();
    const edited = await updateLeadForOwner(db, "user-a", updateLeadSchema.parse({ id: "00000000-0000-4000-8000-000000000002", displayName: "Ava", interest: "Shoes", status: "Won" }));
    expect(edited.id).toBe("00000000-0000-4000-8000-000000000001");
    expect(calls.at(-1)?.operations).toContainEqual(["eq", "business_id", "workspace-a"]);
    expect(calls.at(-1)?.operations).toContainEqual(["eq", "id", "00000000-0000-4000-8000-000000000002"]);

    const failing = fakeDb({ failTable: "contacts" });
    await expect(getLeadsForOwner(failing.db, "user-a", listLeadsSchema.parse({}))).rejects.toThrow("Leads could not be loaded.");
  });

  it("persists a status transition within the owner's workspace", async () => {
    const { db, calls } = fakeDb();
    await expect(updateLeadStatusForOwner(db, "user-a", updateLeadStatusSchema.parse({
      id: "00000000-0000-4000-8000-000000000003",
      status: "Qualified",
    }))).resolves.toEqual({ id: "00000000-0000-4000-8000-000000000001" });
    expect(calls.at(-1)?.operations).toContainEqual(["eq", "business_id", "workspace-a"]);
    expect(calls.at(-1)?.operations).toContainEqual(["update", { lead_status: "Qualified" }]);
  });
});

