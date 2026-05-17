import { NextResponse } from "next/server";
import { getTodayOffers } from "@/lib/offers";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getTodayOffers();
  return NextResponse.json(result);
}
