import { NextRequest, NextResponse } from "next/server";

import { readHasAccess, readListing } from "@/app/lib/stacks/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const listingId = Number(id);
    const buyer = req.nextUrl.searchParams.get("buyer");

    if (!Number.isFinite(listingId) || listingId <= 0) {
      return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
    }

    const listing = await readListing(listingId);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const hasAccess = buyer ? await readHasAccess(listingId, buyer) : false;

    return NextResponse.json({ listing, hasAccess });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load listing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
