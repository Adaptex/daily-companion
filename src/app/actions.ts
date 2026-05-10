"use server";

import { revalidatePath } from "next/cache";
import { invalidateBriefingCache } from "@/lib/briefing";

export async function refreshBriefing() {
  invalidateBriefingCache();
  revalidatePath("/");
}
