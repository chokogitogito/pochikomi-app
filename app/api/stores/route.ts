import { NextRequest, NextResponse } from "next/server";
import { getStores, saveStore } from "@/lib/db";
import type { Store } from "@/lib/types";

export async function GET() {
  const stores = await getStores();
  return NextResponse.json({ stores });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Store;
  const store = await saveStore(body);
  return NextResponse.json({ store });
}
