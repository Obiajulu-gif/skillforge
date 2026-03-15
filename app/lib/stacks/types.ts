export interface PublicStacksConfig {
  stacksNetwork: 'devnet' | 'testnet' | 'mainnet';
  stacksApiUrl: string;
  rpcUrl: string;
  contractAddress: string;
  contractName: string;
  contractId: string;
  sbtcContractId: string;
  usdcxContractId: string;
  ipfsGateway: string;
  explorerBaseUrl: string;
}

export interface TokenMetadata {
  contractId: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface ListingMetadata {
  name: string;
  description: string;
  category: string;
  tags: string[];
  image?: string;
  fullDescription?: string;
  version?: string;
  encryptedInstructions?: string;
  iv?: string;
  authTag?: string;
  skillDocumentId?: string;
  skillDocumentTitle?: string;
  skillDocumentSummary?: string;
  skillDocumentPreview?: string;
  skillDocumentCategory?: string;
  skillDocumentTags?: string[];
  skillDocumentOwner?: string;
}

export interface MarketplaceListing extends ListingMetadata {
  id: number;
  seller: string;
  price: bigint;
  metadataUri: string;
  paymentAssetContractId: string;
  paymentAsset: TokenMetadata;
  isActive: boolean;
  purchaseCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface PurchaseRecord {
  listingId: number;
  buyer: string;
  seller: string;
  paymentAssetContractId: string;
  amountPaid: bigint;
  purchasedAt: number;
}
