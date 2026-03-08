import { NextRequest, NextResponse } from "next/server";

import { readHasAccess, readPurchase } from "@/app/lib/stacks/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const skillId = Number(id);
    const buyer = req.nextUrl.searchParams.get("buyer");

    if (!Number.isFinite(skillId) || !buyer) {
      return NextResponse.json(
        { error: "Missing required params: id (number) and buyer (principal)" },
        { status: 400 },
      );
    }

    const hasPurchased = await readHasAccess(skillId, buyer);
    const purchase = hasPurchased ? await readPurchase(skillId, buyer) : null;

    return NextResponse.json({
      hasPurchased,
      skillId,
      buyer,
      purchase,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to verify purchase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
