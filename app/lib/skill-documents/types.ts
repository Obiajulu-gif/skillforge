export type SkillDocumentSummary = {
  id: string;
  path: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  preview: string;
  tags: string[];
  ownerWallet: string;
  createdAt: string;
  updatedAt: string;
  lineCount: number;
  templateKey?: string;
  paymentAssetContractId?: string;
  settlementNetwork?: string;
  x402Endpoint?: string;
  walletRequired: boolean;
  template: boolean;
};

export type SkillDocumentDetail = SkillDocumentSummary & {
  markdown: string;
  body: string;
  locked: boolean;
  requiresPurchase: boolean;
};

export type SkillDocumentCreateInput = {
  ownerAddress: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  markdown: string;
  templateKey?: string;
  paymentAssetContractId?: string;
  documentId?: string;
};
