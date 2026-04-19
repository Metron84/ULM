import { NextResponse } from "next/server";

import { runSeed } from "@/supabase/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runSeed();
    return NextResponse.json({
      ok: true,
      message: "Supabase seed completed successfully.",
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown seed error";
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase seed failed.",
        error: message,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message: "Use POST /api/seed to run the seed.",
    },
    { status: 405 },
  );
}
