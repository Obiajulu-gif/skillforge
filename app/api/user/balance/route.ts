import { NextRequest, NextResponse } from "next/server";

import { getStacksConfig } from "@/app/lib/stacks/env";
import { readTokenBalance, readTokenMetadata } from "@/app/lib/stacks/server";
import { formatTokenAmount } from "@/app/lib/stacks/utils";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    const contractId = req.nextUrl.searchParams.get("asset");
    const config = getStacksConfig();

    if (!address) {
      return NextResponse.json({ error: "Missing required param: address" }, { status: 400 });
    }

    const asset = contractId || config.sbtcContractId;
    if (!asset) {
      return NextResponse.json({ error: "No asset contract configured" }, { status: 500 });
    }

    const [balance, metadata] = await Promise.all([
      readTokenBalance(asset, address),
      readTokenMetadata(asset),
    ]);

    return NextResponse.json({
      address,
      asset,
      assetSymbol: metadata.symbol,
      assetName: metadata.name,
      balance: balance.toString(),
      balanceFormatted: formatTokenAmount(balance, metadata.decimals),
      network: config.stacksNetwork,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
