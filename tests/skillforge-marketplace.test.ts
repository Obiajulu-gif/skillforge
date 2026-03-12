import { initSimnet } from "@stacks/clarinet-sdk";
import { Cl, type ClarityValue } from "@stacks/transactions";
import { beforeAll, describe, expect, it } from "vitest";

let simnet: Awaited<ReturnType<typeof initSimnet>>;

beforeAll(async () => {
  simnet = await initSimnet();
});

function asString(value: unknown) {
  return Cl.prettyPrint(value as ClarityValue);
}

function expectOkUint(value: unknown, expected: number) {
  expect(asString(value)).toBe(`(ok u${expected})`);
}

function expectOkBool(value: unknown, expected: boolean) {
  expect(asString(value)).toBe(`(ok ${expected ? "true" : "false"})`);
}

function expectErrUint(value: unknown, expected: number) {
  expect(asString(value)).toBe(`(err u${expected})`);
}

function extractFirstUint(value: unknown) {
  const match = asString(value).match(/u(\d+)/);
  if (!match) {
    throw new Error(`Could not parse uint from ${asString(value)}`);
  }
  return Number(match[1]);
}

function createListing(tokenName: string, price: number, metadataUri: string, seller: string, deployer: string) {
  const createListing = simnet.callPublicFn(
    "skillforge-marketplace",
    "create-listing",
    [
      Cl.contractPrincipal(deployer, tokenName),
      Cl.uint(price),
      Cl.stringAscii(metadataUri),
    ],
    seller,
  );

  const listingId = extractFirstUint(createListing.result);
  expectOkUint(createListing.result, listingId);
  return listingId;
}

function mintToken(tokenName: string, amount: number, recipient: string, deployer: string) {
  return simnet.callPublicFn(tokenName, "mint", [Cl.uint(amount), Cl.principal(recipient)], deployer);
}

function getTokenBalance(tokenName: string, address: string, deployer: string) {
  return simnet.callReadOnlyFn(`${deployer}.${tokenName}`, "get-balance", [Cl.principal(address)], address);
}

describe("skillforge-marketplace", () => {
  it("creates a token listing and grants access after purchase", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    const mint = mintToken("mock-sbtc", 2_000_000, buyer, deployer);
    expectOkBool(mint.result, true);

    const initialBuyerBalance = getTokenBalance("mock-sbtc", buyer, deployer);
    const listingId = createListing("mock-sbtc", 750, "ipfs://skillforge/listing-1", seller, deployer);

    const purchase = simnet.callPublicFn(
      "skillforge-marketplace",
      "purchase-listing",
      [Cl.uint(listingId), Cl.contractPrincipal(deployer, "mock-sbtc")],
      buyer,
    );
    expectOkBool(purchase.result, true);

    const access = simnet.callReadOnlyFn(
      "skillforge-marketplace",
      "has-access",
      [Cl.uint(listingId), Cl.principal(buyer)],
      buyer,
    );
    expectOkBool(access.result, true);

    const finalBuyerBalance = getTokenBalance("mock-sbtc", buyer, deployer);
    expect(extractFirstUint(finalBuyerBalance.result)).toBeLessThan(extractFirstUint(initialBuyerBalance.result));
  });

  it("prevents duplicate purchases for the same buyer", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    const mint = mintToken("mock-sbtc", 2_000_000, buyer, deployer);
    expectOkBool(mint.result, true);

    const listingId = createListing("mock-sbtc", 1_000, "ipfs://skillforge/listing-2", seller, deployer);

    const firstPurchase = simnet.callPublicFn(
      "skillforge-marketplace",
      "purchase-listing",
      [Cl.uint(listingId), Cl.contractPrincipal(deployer, "mock-sbtc")],
      buyer,
    );
    expectOkBool(firstPurchase.result, true);

    const duplicatePurchase = simnet.callPublicFn(
      "skillforge-marketplace",
      "purchase-listing",
      [Cl.uint(listingId), Cl.contractPrincipal(deployer, "mock-sbtc")],
      buyer,
    );
    expectErrUint(duplicatePurchase.result, 104);
  });

  it("rejects purchases with the wrong payment asset", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    const mintMock = mintToken("mock-usdcx", 2_000_000, buyer, deployer);
    expectOkBool(mintMock.result, true);

    const listingId = createListing("mock-sbtc", 1_500, "ipfs://skillforge/listing-3", seller, deployer);

    const wrongAssetPurchase = simnet.callPublicFn(
      "skillforge-marketplace",
      "purchase-listing",
      [Cl.uint(listingId), Cl.contractPrincipal(deployer, "mock-usdcx")],
      buyer,
    );
    expectErrUint(wrongAssetPurchase.result, 106);
  });

  it("blocks purchases when a listing is unpublished", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    const mint = mintToken("mock-sbtc", 2_000_000, buyer, deployer);
    expectOkBool(mint.result, true);

    const listingId = createListing("mock-sbtc", 1_500, "ipfs://skillforge/listing-4", seller, deployer);

    const unpublish = simnet.callPublicFn(
      "skillforge-marketplace",
      "set-listing-status",
      [Cl.uint(listingId), Cl.bool(false)],
      seller,
    );
    expectOkBool(unpublish.result, false);

    const blockedPurchase = simnet.callPublicFn(
      "skillforge-marketplace",
      "purchase-listing",
      [Cl.uint(listingId), Cl.contractPrincipal(deployer, "mock-sbtc")],
      buyer,
    );
    expectErrUint(blockedPurchase.result, 105);
  });
});
