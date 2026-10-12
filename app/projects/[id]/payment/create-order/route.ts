import { NextResponse } from "next/server";

// Payments are intentionally disabled while YOUTENT marketplace is rebuilt.
export async function POST() {
  return NextResponse.json(
    { error: "Payments are temporarily disabled. Please check back later." },
    { status: 410 }
  );
}
