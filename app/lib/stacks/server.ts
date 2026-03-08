import {
  Cl,
  ClarityType,
  type ClarityValue,
  cvToValue,
  fetchCallReadOnlyFunction,
} from "@stacks/transactions";

import { getHiroHeaders, getStacksConfig, getStacksNetworkClient } from "./env";
import type { ListingMetadata, MarketplaceListing, PurchaseRecord, TokenMetadata } from "./types";
import { splitContractId } from "./utils";

const DEFAULT_METADATA: ListingMetadata = {
  name: "Untitled Listing",
  description: "No description available.",
  category: "General",
  tags: [],
};

const tokenMetadataCache = new Map<string, TokenMetadata>();

function toNumber(value: unknown) {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "number") {
    return value;
  }
  return Number(value ?? 0);
}

function toBigInt(value: unknown) {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number") {
    return BigInt(value);
  }
  if (typeof value === "string" && value.length > 0) {
    return BigInt(value);
  }
  return BigInt(0);
}

function toBoolean(value: unknown) {
  return Boolean(value);
}

function toOptionalRecord(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}

function unwrapResponse(value: ClarityValue) {
  if (value.type === ClarityType.ResponseOk) {
    return value.value;
  }

  if (value.type === ClarityType.ResponseErr) {
    const reason = cvToValue(value.value);
    throw new Error(typeof reason === "string" ? reason : "Read-only call returned err");
  }

  return value;
}

function unwrapOptional(value: ClarityValue) {
  const unwrapped = unwrapResponse(value);

  if (unwrapped.type === ClarityType.OptionalNone) {
    return null;
  }

  if (unwrapped.type === ClarityType.OptionalSome) {
    return unwrapped.value;
  }

  return unwrapped;
}

function defaultSenderAddress() {
  const config = getStacksConfig();
  const network = getStacksNetworkClient();
  return config.contractAddress || network.bootAddress;
}

async function callReadOnlyRaw(
  contractId: string,
  functionName: string,
  functionArgs: ClarityValue[] = [],
  senderAddress?: string,
) {
  const { address, contractName } = splitContractId(contractId);
  if (!address || !contractName) {
    throw new Error(`Invalid contract identifier: ${contractId}`);
  }

  return fetchCallReadOnlyFunction({
    contractAddress: address,
    contractName,
    functionName,
    functionArgs,
    senderAddress: senderAddress ?? defaultSenderAddress(),
    network: getStacksNetworkClient(),
  });
}

async function fetchTokenMetadata(contractId: string): Promise<TokenMetadata> {
  const cached = tokenMetadataCache.get(contractId);
  if (cached) {
    return cached;
  }

  const [nameCv, symbolCv, decimalsCv] = await Promise.all([
    callReadOnlyRaw(contractId, "get-name"),
    callReadOnlyRaw(contractId, "get-symbol"),
    callReadOnlyRaw(contractId, "get-decimals"),
  ]);

  const metadata = {
    contractId,
    name: String(cvToValue(unwrapResponse(nameCv))),
    symbol: String(cvToValue(unwrapResponse(symbolCv))),
    decimals: toNumber(cvToValue(unwrapResponse(decimalsCv))),
  };

  tokenMetadataCache.set(contractId, metadata);
  return metadata;
}

function normalizeListingTuple(id: number, value: unknown) {
  const listing = toOptionalRecord(value);
  if (!listing) {
    return null;
  }

  return {
    id,
    seller: String(listing.seller ?? ""),
    metadataUri: String(listing["metadata-uri"] ?? ""),
    paymentAssetContractId: String(listing["payment-asset"] ?? ""),
    price: toBigInt(listing.price),
    isActive: toBoolean(listing.active),
    purchaseCount: toNumber(listing["purchase-count"]),
    createdAt: toNumber(listing["created-at"]),
    updatedAt: toNumber(listing["updated-at"]),
  };
}

async function fetchListingMetadata(metadataUri: string) {
  if (!metadataUri) {
    return DEFAULT_METADATA;
  }

  const { ipfsGateway } = getStacksConfig();
  const metadataUrl = metadataUri.startsWith("ipfs://")
    ? `${ipfsGateway}${metadataUri.replace("ipfs://", "")}`
    : metadataUri;

  try {
    const response = await fetch(metadataUrl, { cache: "no-store" });
    if (!response.ok) {
      return DEFAULT_METADATA;
    }
    const json = await response.json();
    return {
      ...DEFAULT_METADATA,
      ...json,
      tags: Array.isArray(json.tags) ? json.tags : [],
    } satisfies ListingMetadata;
  } catch {
    return DEFAULT_METADATA;
  }
}

export async function readListingCount() {
  const { contractId } = getStacksConfig();
  const response = await callReadOnlyRaw(contractId, "get-listing-count");
  return toNumber(cvToValue(unwrapResponse(response)));
}

export async function readListing(listingId: number) {
  const { contractId } = getStacksConfig();
  const response = await callReadOnlyRaw(contractId, "get-listing", [Cl.uint(listingId)]);
  const listingValue = unwrapOptional(response);
  if (!listingValue) {
    return null;
  }

  const tuple = normalizeListingTuple(listingId, cvToValue(listingValue));
  if (!tuple) {
    return null;
  }

  const [paymentAsset, metadata] = await Promise.all([
    fetchTokenMetadata(tuple.paymentAssetContractId),
    fetchListingMetadata(tuple.metadataUri),
  ]);

  return {
    ...metadata,
    id: tuple.id,
    seller: tuple.seller,
    price: tuple.price,
    metadataUri: tuple.metadataUri,
    paymentAssetContractId: tuple.paymentAssetContractId,
    paymentAsset,
    isActive: tuple.isActive,
    purchaseCount: tuple.purchaseCount,
    createdAt: tuple.createdAt,
    updatedAt: tuple.updatedAt,
  } satisfies MarketplaceListing;
}

export async function readListings() {
  const count = await readListingCount();
  const ids = Array.from({ length: count }, (_, index) => index + 1);
  const listings = await Promise.all(ids.map(id => readListing(id)));
  return listings.filter((listing): listing is MarketplaceListing => Boolean(listing));
}

export async function readHasAccess(listingId: number, buyer: string) {
  const { contractId } = getStacksConfig();
  const response = await callReadOnlyRaw(
    contractId,
    "has-access",
    [Cl.uint(listingId), Cl.principal(buyer)],
    buyer,
  );
  return toBoolean(cvToValue(unwrapResponse(response)));
}

export async function readPurchase(listingId: number, buyer: string) {
  const { contractId } = getStacksConfig();
  const response = await callReadOnlyRaw(
    contractId,
    "get-purchase",
    [Cl.uint(listingId), Cl.principal(buyer)],
    buyer,
  );
  const purchaseValue = unwrapOptional(response);
  if (!purchaseValue) {
    return null;
  }

  const tuple = toOptionalRecord(cvToValue(purchaseValue));

  if (!tuple) {
    return null;
  }

  return {
    listingId,
    buyer,
    seller: String(tuple.seller ?? ""),
    paymentAssetContractId: String(tuple["payment-asset"] ?? ""),
    amountPaid: toBigInt(tuple["amount-paid"]),
    purchasedAt: toNumber(tuple["purchased-at"]),
  } satisfies PurchaseRecord;
}

export async function readTokenBalance(contractId: string, address: string) {
  const response = await callReadOnlyRaw(contractId, "get-balance", [Cl.principal(address)], address);
  return toBigInt(cvToValue(unwrapResponse(response)));
}

export async function readBuyerListings(buyer: string) {
  const listings = await readListings();
  const accessList = await Promise.all(
    listings.map(async listing => ({
      listing,
      hasAccess: await readHasAccess(listing.id, buyer),
    })),
  );

  return accessList.filter(entry => entry.hasAccess).map(entry => entry.listing);
}

export async function fetchTransactionDetails(txId: string) {
  const config = getStacksConfig();
  const url = `${config.stacksApiUrl}/extended/v1/tx/${txId}`;
  const response = await fetch(url, {
    headers: new Headers(getHiroHeaders()),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch transaction ${txId}`);
  }

  return response.json();
}

export async function fetchAddressTransactionWithTransfers(address: string, txId: string) {
  const config = getStacksConfig();
  const url = `${config.stacksApiUrl}/extended/v1/address/${address}/${txId}/with_transfers`;
  const response = await fetch(url, {
    headers: new Headers(getHiroHeaders()),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch transfer details for ${txId}`);
  }

  return response.json();
}

export async function readTokenMetadata(contractId: string) {
  return fetchTokenMetadata(contractId);
}

export function getMarketplaceContractParts() {
  const { contractId } = getStacksConfig();
  return splitContractId(contractId);
}
