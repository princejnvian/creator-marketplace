import { NextResponse } from "next/server";

const disabled = () => NextResponse.json({ error: "Ordering and payments are temporarily disabled while YOUTENT rebuilds checkout." }, { status: 410 });
export async function GET() { return disabled(); }
export async function POST() { return disabled(); }
export async function PUT() { return disabled(); }
export async function PATCH() { return disabled(); }
export async function DELETE() { return disabled(); }
