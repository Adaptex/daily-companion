"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function refreshBriefing() {
  revalidateTag("world-ai-briefing");
  revalidateTag("sports-briefing");
  revalidatePath("/");
}
