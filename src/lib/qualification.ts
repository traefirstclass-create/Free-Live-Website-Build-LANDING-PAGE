import type { RevenueBand, TimeOperating, WebsiteStatus } from "./schema";

export type ApplicationStatus = "qualified" | "disqualified";

const REVENUE_POINTS: Record<RevenueBand, number> = {
  under_1k: 10,
  "1k_5k": 25,
  "5k_20k": 40,
  "20k_plus": 50,
};

const TIME_POINTS: Record<TimeOperating, number> = {
  lt_3m: 0,
  "3_12m": 15,
  "1_3y": 30,
  "3y_plus": 40,
};

// Small nudge for people most likely to want a new site.
const WEBSITE_POINTS: Record<WebsiteStatus, number> = {
  no: 10,
  hate_it: 10,
  yes: 0,
};

/** 0–100. Revenue (max 50) + time in business (max 40) + website need (max 10). */
export function priorityScore(input: {
  monthly_revenue: RevenueBand;
  time_operating: TimeOperating;
  current_website: WebsiteStatus;
}) {
  return (
    REVENUE_POINTS[input.monthly_revenue] +
    TIME_POINTS[input.time_operating] +
    WEBSITE_POINTS[input.current_website]
  );
}

export function qualify(input: {
  time_operating: TimeOperating;
  generating_income: "yes" | "no";
  ready_to_invest: boolean;
}): { status: ApplicationStatus; reasons: string[] } {
  const reasons: string[] = [];
  if (input.time_operating === "lt_3m") reasons.push("Operating less than 3 months");
  if (input.generating_income === "no") reasons.push("Not currently generating income");
  if (!input.ready_to_invest) reasons.push("Not ready to invest $300");
  return { status: reasons.length ? "disqualified" : "qualified", reasons };
}
