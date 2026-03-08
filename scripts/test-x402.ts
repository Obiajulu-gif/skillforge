import "dotenv/config";

async function main() {
  const appBaseUrl = process.env.APP_BASE_URL ?? "http://127.0.0.1:3000";
  const listingId = process.env.X402_LISTING_ID;

  if (!listingId) {
    process.stdout.write("Skipping x402 smoke test because X402_LISTING_ID is not configured.\n");
    return;
  }

  const response = await fetch(`${appBaseUrl}/api/skills/x402-execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      skillId: Number(listingId),
    }),
  });

  if (response.status !== 402) {
    throw new Error(`Expected 402 from unpaid x402 request, received ${response.status}`);
  }

  const paymentRequired = response.headers.get("PAYMENT-REQUIRED");
  if (!paymentRequired) {
    throw new Error("Expected PAYMENT-REQUIRED header on unpaid x402 request");
  }

  process.stdout.write("x402 smoke test passed.\n");
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown error"}\n`);
  process.exit(1);
});
