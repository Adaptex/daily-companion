import { NextResponse } from "next/server";
import { getTodayOffers } from "@/lib/offers";

export const revalidate = 3600; // Cache response for 1 hour

export async function GET() {
  const result = await getTodayOffers();
  return NextResponse.json(result);
}
