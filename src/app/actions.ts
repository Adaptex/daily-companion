"use server";

import { revalidatePath } from "next/cache";
import { invalidateBriefingCache } from "@/lib/briefing";
import { invalidateSportsBriefingCache } from "@/lib/sports/briefing";

export async function refreshBriefing() {
  invalidateBriefingCache();
  invalidateSportsBriefingCache();
  revalidatePath("/");
}
