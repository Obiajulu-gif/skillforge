import { NextRequest, NextResponse } from "next/server";

import { readHasAccess, readListings } from "@/app/lib/stacks/server";

export async function GET(req: NextRequest) {
  try {
    const buyer = req.nextUrl.searchParams.get("buyer");
    const listings = await readListings();

    if (!buyer) {
      return NextResponse.json({ listings });
    }

    const listingsWithAccess = await Promise.all(
      listings.map(async (listing) => ({
        ...listing,
        hasAccess: await readHasAccess(listing.id, buyer),
      })),
    );

    return NextResponse.json({ listings: listingsWithAccess });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load listings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
