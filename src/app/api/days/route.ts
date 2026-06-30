import { NextResponse } from "next/server";
import { getOrCreateAnonId } from "@/lib/storage/anonId";
import { getSupabaseAdapter } from "@/lib/storage/supabaseAdapter";
import { NewSavedDaySchema } from "@/lib/storage/savedDaySchema";

export async function GET(): Promise<NextResponse> {
  const anonId = await getOrCreateAnonId();

  try {
    const days = await getSupabaseAdapter().listDays(anonId);
    return NextResponse.json(days, { status: 200 });
  } catch (error) {
    console.error("[api/days] GET failed", error);
    return NextResponse.json(
      { error: "Unable to load saved days" },
      { status: 502 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const anonId = await getOrCreateAnonId();

  const body: unknown = await request.json();
  const result = NewSavedDaySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  try {
    const saved = await getSupabaseAdapter().saveDay(anonId, result.data);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("[api/days] POST failed", error);
    return NextResponse.json({ error: "Unable to save day" }, { status: 502 });
  }
}
