export type MonthRange = { start: string; end: string; label: string };

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)])) as Record<string, number>;
  return {
    year: values["year"]!,
    month: values["month"]!,
    day: values["day"]!,
    hour: values["hour"]!,
    minute: values["minute"]!,
    second: values["second"]!,
  };
}

function localMidnightUtc(year: number, month: number, timeZone: string) {
  const desired = Date.UTC(year, month - 1, 1);
  let guess = desired;
  for (let index = 0; index < 3; index += 1) {
    const p = localParts(new Date(guess), timeZone);
    const represented = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    guess += desired - represented;
  }
  return new Date(guess);
}

export function workspaceMonthRanges(now: Date, timeZone: string, count = 8): MonthRange[] {
  const current = localParts(now, timeZone);
  return Array.from({ length: count }, (_, index) => {
    const monthDate = new Date(Date.UTC(current.year, current.month - count + index, 1));
    const year = monthDate.getUTCFullYear();
    const month = monthDate.getUTCMonth() + 1;
    return {
      start: localMidnightUtc(year, month, timeZone).toISOString(),
      end: localMidnightUtc(year, month + 1, timeZone).toISOString(),
      label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(monthDate),
    };
  });
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}
