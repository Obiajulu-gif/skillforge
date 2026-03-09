import { initSimnet } from "@stacks/clarinet-sdk";
import { Cl, type ClarityValue } from "@stacks/transactions";
import { beforeAll, describe, expect, it } from "vitest";

let simnet: Awaited<ReturnType<typeof initSimnet>>;

const sbtcAddress = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4";
const sbtcToken = `${sbtcAddress}.sbtc-token`;

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

function createSbtcListing(price: number, metadataUri: string, seller: string) {
  const createListing = simnet.callPublicFn(
    "skillforge-marketplace",
    "create-listing",
    [
      Cl.contractPrincipal(sbtcAddress, "sbtc-token"),
      Cl.uint(price),
      Cl.stringAscii(metadataUri),
    ],
    seller,
  );

  const listingId = extractFirstUint(createListing.result);
  expectOkUint(createListing.result, listingId);
  return listingId;
}

function getSbtcBalance(address: string) {
  return simnet.callReadOnlyFn(sbtcToken, "get-balance", [Cl.principal(address)], address);
}

describe("skillforge-marketplace", () => {
  it("creates an sBTC listing and grants access after purchase", () => {
    const accounts = simnet.getAccounts();
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    const initialBuyerBalance = getSbtcBalance(buyer);
    const listingId = createSbtcListing(750, "ipfs://skillforge/listing-1", seller);

    const purchase = simnet.callPublicFn(
      "skillforge-marketplace",
      "purchase-listing",
      [Cl.uint(listingId), Cl.contractPrincipal(sbtcAddress, "sbtc-token")],
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

    const finalBuyerBalance = getSbtcBalance(buyer);
    expect(extractFirstUint(finalBuyerBalance.result)).toBeLessThan(extractFirstUint(initialBuyerBalance.result));
  });

  it("prevents duplicate purchases for the same buyer", () => {
    const accounts = simnet.getAccounts();
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    const listingId = createSbtcListing(1_000, "ipfs://skillforge/listing-2", seller);

    const firstPurchase = simnet.callPublicFn(
      "skillforge-marketplace",
      "purchase-listing",
      [Cl.uint(listingId), Cl.contractPrincipal(sbtcAddress, "sbtc-token")],
      buyer,
    );
    expectOkBool(firstPurchase.result, true);

    const duplicatePurchase = simnet.callPublicFn(
      "skillforge-marketplace",
      "purchase-listing",
      [Cl.uint(listingId), Cl.contractPrincipal(sbtcAddress, "sbtc-token")],
      buyer,
    );
    expectErrUint(duplicatePurchase.result, 104);
  });

  it("rejects purchases with the wrong payment asset", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    const mintMock = simnet.callPublicFn(
      "mock-usdcx",
      "mint",
      [Cl.uint(2_000_000), Cl.principal(buyer)],
      deployer,
    );
    expectOkBool(mintMock.result, true);

    const listingId = createSbtcListing(1_500, "ipfs://skillforge/listing-3", seller);

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
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    const listingId = createSbtcListing(1_500, "ipfs://skillforge/listing-4", seller);

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
      [Cl.uint(listingId), Cl.contractPrincipal(sbtcAddress, "sbtc-token")],
      buyer,
    );
    expectErrUint(blockedPurchase.result, 105);
  });
});
