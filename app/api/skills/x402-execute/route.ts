import { NextRequest, NextResponse } from "next/server";
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import type { PaymentPayload, PaymentRequired } from "@x402/core/types";

import { getStacksConfig } from "@/app/lib/stacks/env";
import { fetchTransactionDetails, readHasAccess, readListing } from "@/app/lib/stacks/server";

type ExecuteBody = {
  skillId?: number;
  input?: string;
  buyer?: string;
};

type StacksPaymentPayload = PaymentPayload["payload"] & {
  txid?: string;
  buyer?: string;
};

function paymentRequiredResponse(skillId: number, listing: NonNullable<Awaited<ReturnType<typeof readListing>>>) {
  const config = getStacksConfig();

  const paymentRequired: PaymentRequired = {
    x402Version: 2,
    error: "Payment required before skill execution",
    resource: {
      url: "/api/skills/x402-execute",
      description: `Execute listing ${skillId}`,
      mimeType: "application/json",
    },
    accepts: [
      {
        scheme: "exact",
        network: `stacks:${config.stacksNetwork}`,
        asset: listing.paymentAssetContractId,
        amount: listing.price.toString(),
        payTo: listing.seller,
        maxTimeoutSeconds: 600,
        extra: {
          listingId: skillId,
          contractId: config.contractId,
          functionName: "purchase-listing",
        },
      },
    ],
  };

  return paymentRequired;
}

function parseLegacyOrCurrentHeader(req: NextRequest) {
  return req.headers.get("PAYMENT-SIGNATURE") ?? req.headers.get("X-PAYMENT");
}

async function executeSkill(req: NextRequest, body: ExecuteBody, listingId: number, buyer: string, txid?: string) {
  const executionResponse = await fetch(new URL("/api/agent", req.nextUrl.origin), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skillId: listingId,
      input: body.input ?? "",
      buyer,
      transactionId: txid ?? null,
    }),
  });

  const executionBody = await executionResponse.json();
  if (!executionResponse.ok) {
    return NextResponse.json(executionBody, { status: executionResponse.status });
  }

  const config = getStacksConfig();
  const paymentResponseHeader = encodePaymentResponseHeader({
    success: true,
    payer: buyer,
    transaction: txid ?? "existing-access",
    network: `stacks:${config.stacksNetwork}`,
    extensions: {},
  });

  return NextResponse.json(
    {
      success: true,
      paidVia: txid ? "x402" : "existing-access",
      listingId,
      transactionId: txid ?? null,
      result: executionBody,
    },
    {
      headers: {
        "PAYMENT-RESPONSE": paymentResponseHeader,
      },
    },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExecuteBody;
    const listingId = Number(body.skillId);

    if (!Number.isFinite(listingId) || listingId <= 0) {
      return NextResponse.json({ error: "Missing required field: skillId" }, { status: 400 });
    }

    const listing = await readListing(listingId);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (body.buyer) {
      const hasExistingAccess = await readHasAccess(listingId, body.buyer);
      if (hasExistingAccess) {
        return executeSkill(req, body, listingId, body.buyer);
      }
    }

    const paymentHeader = parseLegacyOrCurrentHeader(req);
    if (!paymentHeader) {
      const paymentRequired = paymentRequiredResponse(listingId, listing);
      return NextResponse.json(paymentRequired, {
        status: 402,
        headers: {
          "PAYMENT-REQUIRED": encodePaymentRequiredHeader(paymentRequired),
        },
      });
    }

    const paymentPayload = decodePaymentSignatureHeader(paymentHeader);
    const accepted = paymentPayload.accepted;

    if (
      accepted.scheme !== "exact" ||
      accepted.asset !== listing.paymentAssetContractId ||
      accepted.amount !== listing.price.toString() ||
      accepted.payTo !== listing.seller
    ) {
      return NextResponse.json({ error: "Invalid payment terms" }, { status: 402 });
    }

    const payload = paymentPayload.payload as StacksPaymentPayload;
    const txid = typeof payload.txid === "string" ? payload.txid : undefined;
    const buyer = body.buyer || (typeof payload.buyer === "string" ? payload.buyer : undefined);

    if (!txid || !buyer) {
      return NextResponse.json({ error: "Missing txid or buyer in payment payload" }, { status: 402 });
    }

    const transaction = await fetchTransactionDetails(txid);
    if (transaction.tx_status !== "success") {
      return NextResponse.json({ error: "Payment transaction is not confirmed yet" }, { status: 402 });
    }

    const hasAccess = await readHasAccess(listingId, buyer);
    if (!hasAccess) {
      return NextResponse.json({ error: "Payment transaction not settled on-chain yet" }, { status: 402 });
    }

    return executeSkill(req, body, listingId, buyer, txid);
  } catch (error) {
    return NextResponse.json(
      {
        error: "x402 execution failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
