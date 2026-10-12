import { NextResponse } from "next/server";

type Props = { params: Promise<{ id: string }> };

// Payment verification is intentionally disabled while YOUTENT marketplace is rebuilt.
export async function POST(_request: Request, _context: Props) {
  return NextResponse.json(
    { error: "Payments are temporarily disabled. No payment was processed by this endpoint." },
    { status: 410 }
  );
}
