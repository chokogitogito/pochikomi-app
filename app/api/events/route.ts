import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "@/lib/db";

const allowedEvents = new Set([
  "survey_started",
  "review_generated",
  "review_copied",
  "review_clicked",
  "coupon_issued",
  "review_generation_failed",
  "review_copy_failed",
]);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { storeId, sessionId, type, payload } = body;

  if (typeof storeId !== "string" || typeof type !== "string") {
    return NextResponse.json({ error: "storeId and type are required" }, { status: 400 });
  }

  if (!allowedEvents.has(type)) {
    return NextResponse.json({ error: "Unsupported event type" }, { status: 400 });
  }

  const safeSessionId = typeof sessionId === "string" ? sessionId : null;
  const event = await recordEvent(storeId, type, payload ?? null, safeSessionId);

  return NextResponse.json({ ok: true, event });
}
