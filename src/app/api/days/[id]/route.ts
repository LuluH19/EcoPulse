import { NextResponse } from "next/server";
import { getOrCreateAnonId } from "@/lib/storage/anonId";
import { getSupabaseAdapter } from "@/lib/storage/supabaseAdapter";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const anonId = await getOrCreateAnonId();
  const { id } = await params;

  try {
    await getSupabaseAdapter().deleteDay(anonId, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[api/days/[id]] DELETE failed", error);
    return NextResponse.json(
      { error: "Unable to delete day" },
      { status: 502 }
    );
  }
}
