import { describe, expect, it } from "vitest";
import { percentChange, workspaceMonthRanges } from "@/lib/dashboard-metrics";

describe("dashboard metric calculations", () => {
  it("builds workspace-local calendar month windows across year boundaries", () => {
    const ranges = workspaceMonthRanges(new Date("2026-01-15T12:00:00.000Z"), "Africa/Harare", 2);

    expect(ranges.map(({ label }) => label)).toEqual(["Dec", "Jan"]);
    expect(ranges[0]?.start).toBe("2025-11-30T22:00:00.000Z");
    expect(ranges[1]?.start).toBe("2025-12-31T22:00:00.000Z");
    expect(ranges[1]?.end).toBe("2026-01-31T22:00:00.000Z");
  });

  it("calculates conversation change without inventing a rate from a zero baseline", () => {
    expect(percentChange(15, 10)).toBe(50);
    expect(percentChange(5, 10)).toBe(-50);
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(1, 0)).toBeNull();
  });

  it("keeps monthly boundaries correct when the workspace observes daylight saving time", () => {
    const ranges = workspaceMonthRanges(new Date("2026-03-15T12:00:00.000Z"), "America/New_York", 2);

    expect(ranges[1]?.start).toBe("2026-03-01T05:00:00.000Z");
    expect(ranges[1]?.end).toBe("2026-04-01T04:00:00.000Z");
  });
});
