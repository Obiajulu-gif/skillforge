import { NextRequest, NextResponse } from "next/server";

import { readBuyerListings } from "@/app/lib/stacks/server";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Missing required param: address" }, { status: 400 });
    }

    const listings = await readBuyerListings(address);
    const purchases = listings.map((listing) => listing.id);

    return NextResponse.json({
      purchases,
      listings,
      address,
      total: purchases.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch user purchases",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
