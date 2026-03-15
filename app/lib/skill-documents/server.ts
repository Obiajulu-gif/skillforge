import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import matter from "gray-matter";

import { getStacksConfig } from "@/app/lib/stacks/env";

import type { SkillDocumentCreateInput, SkillDocumentDetail, SkillDocumentSummary } from "./types";

const SKILL_DOCUMENT_BUCKET = "skill-documents";
const TEMPLATE_OWNER = "seed";
const TEMPLATE_DIR = path.join(process.cwd(), "content", "skill-documents");

let bucketReady: Promise<void> | null = null;
let seedReady: Promise<void> | null = null;

type ParsedSkillDocument = SkillDocumentSummary & {
  markdown: string;
  body: string;
};

function requireSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey };
}

function getSupabaseAdminClient() {
  const { url, serviceRoleKey } = requireSupabaseConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(entry => String(entry).trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function toIsoString(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return fallback;
}

function extractPreview(body: string, maxLength = 240) {
  const normalized = body
    .replace(/\r/g, "")
    .replace(/^#+\s+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function buildDefaultBody(input: {
  title: string;
  summary: string;
  category: string;
  tags: string[];
}) {
  const tags = input.tags.length > 0 ? input.tags.map(tag => `- ${tag}`).join("\n") : "- stacks\n- x402\n- leather";

  return [
    `# ${input.title}`,
    "",
    input.summary,
    "",
    "## Ideal Use Cases",
    "",
    `- ${input.category} teams shipping repeatable workflows`,
    "- Agents that need explicit operating constraints",
    "- Wallet-aware commerce flows that settle before execution",
    "",
    "## Inputs",
    "",
    "- Goal",
    "- Context",
    "- Constraints",
    "- Success criteria",
    "",
    "## Workflow",
    "",
    "1. Read the request and identify the main objective.",
    "2. Ask for the minimum missing context before acting.",
    "3. Produce a structured response with concrete next steps.",
    "4. Keep outputs concise, operator-readable, and execution-ready.",
    "",
    "## Tags",
    "",
    tags,
    "",
    "## Output Contract",
    "",
    "- Return a direct answer first.",
    "- Include action steps before optional explanation.",
    "- Avoid filler language.",
  ].join("\n");
}

function buildDocumentId(ownerAddress: string, title: string) {
  return `${ownerAddress.toLowerCase()}--${slugify(title)}--${randomUUID().slice(0, 8)}`;
}

function documentPathForId(documentId: string) {
  return `${documentId}.md`;
}

function parseSkillDocument(pathname: string, markdown: string): ParsedSkillDocument {
  const parsed = matter(markdown);
  const now = new Date().toISOString();
  const fallbackTitle = pathname.replace(/\.md$/i, "").replace(/[-_]+/g, " ");
  const title = typeof parsed.data.title === "string" && parsed.data.title.trim() ? parsed.data.title.trim() : fallbackTitle;
  const summary =
    typeof parsed.data.summary === "string" && parsed.data.summary.trim()
      ? parsed.data.summary.trim()
      : extractPreview(parsed.content);
  const id =
    typeof parsed.data.id === "string" && parsed.data.id.trim()
      ? parsed.data.id.trim()
      : pathname.replace(/\.md$/i, "");
  const ownerWallet =
    typeof parsed.data.owner_wallet === "string" && parsed.data.owner_wallet.trim()
      ? parsed.data.owner_wallet.trim()
      : TEMPLATE_OWNER;
  const category =
    typeof parsed.data.category === "string" && parsed.data.category.trim()
      ? parsed.data.category.trim()
      : "General";
  const tags = normalizeTags(parsed.data.tags);
  const createdAt = toIsoString(parsed.data.created_at, now);
  const updatedAt = toIsoString(parsed.data.updated_at, createdAt);
  const templateKey =
    typeof parsed.data.template_key === "string" && parsed.data.template_key.trim()
      ? parsed.data.template_key.trim()
      : undefined;
  const paymentAssetContractId =
    typeof parsed.data.payment_asset_contract_id === "string" && parsed.data.payment_asset_contract_id.trim()
      ? parsed.data.payment_asset_contract_id.trim()
      : undefined;
  const settlementNetwork =
    typeof parsed.data.settlement_network === "string" && parsed.data.settlement_network.trim()
      ? parsed.data.settlement_network.trim()
      : undefined;
  const x402Endpoint =
    typeof parsed.data.x402_endpoint === "string" && parsed.data.x402_endpoint.trim()
      ? parsed.data.x402_endpoint.trim()
      : undefined;
  const walletRequired = parsed.data.wallet_required !== false;
  const body = parsed.content.trim();

  return {
    id,
    path: pathname,
    title,
    slug:
      typeof parsed.data.slug === "string" && parsed.data.slug.trim()
        ? parsed.data.slug.trim()
        : slugify(title),
    category,
    summary,
    preview: extractPreview(body),
    tags,
    ownerWallet,
    createdAt,
    updatedAt,
    lineCount: markdown.replace(/\r/g, "").split("\n").length,
    templateKey,
    paymentAssetContractId,
    settlementNetwork,
    x402Endpoint,
    walletRequired,
    template: ownerWallet === TEMPLATE_OWNER,
    markdown,
    body,
  };
}

function composeSkillDocumentMarkdown(input: SkillDocumentCreateInput) {
  const parsed = matter(input.markdown);
  const config = getStacksConfig();
  const now = new Date().toISOString();
  const title = input.title.trim();
  const summary = input.summary.trim();
  const category = input.category.trim() || "General";
  const tags = input.tags.map(tag => tag.trim()).filter(Boolean);
  const documentId = input.documentId?.trim() || buildDocumentId(input.ownerAddress, title);
  const body = parsed.content.trim() || buildDefaultBody({ title, summary, category, tags });

  const frontmatter = {
    ...(typeof parsed.data === "object" ? parsed.data : {}),
    id: documentId,
    title,
    slug: slugify(title),
    category,
    summary,
    tags,
    owner_wallet: input.ownerAddress,
    created_at: toIsoString(parsed.data.created_at, now),
    updated_at: now,
    template_key: input.templateKey || undefined,
    payment_asset_contract_id: input.paymentAssetContractId || undefined,
    settlement_network: `stacks:${config.stacksNetwork}`,
    x402_endpoint: "/api/skills/x402-execute",
    wallet_required: true,
  };

  return matter.stringify(`${body}\n`, Object.fromEntries(
    Object.entries(frontmatter).filter(([, value]) => value !== undefined),
  )).replace(/\r\n/g, "\n");
}

export function toSummary(document: ParsedSkillDocument): SkillDocumentSummary {
  return {
    id: document.id,
    path: document.path,
    title: document.title,
    slug: document.slug,
    category: document.category,
    summary: document.summary,
    preview: document.preview,
    tags: document.tags,
    ownerWallet: document.ownerWallet,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    lineCount: document.lineCount,
    templateKey: document.templateKey,
    paymentAssetContractId: document.paymentAssetContractId,
    settlementNetwork: document.settlementNetwork,
    x402Endpoint: document.x402Endpoint,
    walletRequired: document.walletRequired,
    template: document.template,
  };
}

async function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const supabase = getSupabaseAdminClient();
      const { data: bucket, error: bucketError } = await supabase.storage.getBucket(SKILL_DOCUMENT_BUCKET);

      if (!bucketError && bucket) {
        return;
      }

      const { error } = await supabase.storage.createBucket(SKILL_DOCUMENT_BUCKET, {
        public: false,
        allowedMimeTypes: ["text/markdown", "text/plain"],
        fileSizeLimit: 1_048_576,
      });

      if (error && !/already exists/i.test(error.message)) {
        throw new Error(`Unable to create Supabase bucket: ${error.message}`);
      }
    })();
  }

  return bucketReady;
}

async function readLocalTemplateDocuments() {
  const entries = await readdir(TEMPLATE_DIR, { withFileTypes: true });
  const markdownFiles = entries.filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith(".md"));

  const documents = await Promise.all(
    markdownFiles.map(async (entry) => {
      const filePath = path.join(TEMPLATE_DIR, entry.name);
      const markdown = await readFile(filePath, "utf8");
      return parseSkillDocument(entry.name, markdown);
    }),
  );

  return documents.sort((left, right) => left.title.localeCompare(right.title));
}

export async function ensureSeedSkillDocuments() {
  if (!seedReady) {
    seedReady = (async () => {
      await ensureBucket();
      const supabase = getSupabaseAdminClient();
      const templates = await readLocalTemplateDocuments();

      for (const template of templates) {
        const objectPath = documentPathForId(template.id);
        const { data: existing } = await supabase.storage.from(SKILL_DOCUMENT_BUCKET).list("", {
          search: objectPath,
          limit: 1,
        });

        if (existing?.some(item => item.name === objectPath)) {
          continue;
        }

        const { error } = await supabase.storage.from(SKILL_DOCUMENT_BUCKET).upload(objectPath, template.markdown, {
          upsert: true,
          contentType: "text/markdown",
        });

        if (error) {
          throw new Error(`Unable to seed ${template.title}: ${error.message}`);
        }
      }
    })();
  }

  return seedReady;
}

async function listRemoteDocumentPaths() {
  await ensureBucket();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(SKILL_DOCUMENT_BUCKET).list("", {
    limit: 200,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    throw new Error(`Unable to list Supabase skill documents: ${error.message}`);
  }

  return (data ?? [])
    .map(entry => entry.name)
    .filter(name => name.toLowerCase().endsWith(".md"));
}

async function readRemoteDocument(pathname: string) {
  await ensureBucket();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(SKILL_DOCUMENT_BUCKET).download(pathname);

  if (error || !data) {
    throw new Error(`Unable to download ${pathname}: ${error?.message ?? "Unknown error"}`);
  }

  const markdown = await data.text();
  return parseSkillDocument(pathname, markdown);
}

export async function listSkillDocuments(ownerWallet?: string) {
  await ensureSeedSkillDocuments();
  const paths = await listRemoteDocumentPaths();
  const documents = await Promise.all(paths.map(entry => readRemoteDocument(entry)));

  return documents
    .filter(document => !ownerWallet || document.ownerWallet.toLowerCase() === ownerWallet.toLowerCase())
    .map(toSummary)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function saveSkillDocument(input: SkillDocumentCreateInput) {
  if (!input.ownerAddress.trim()) {
    throw new Error("A connected wallet address is required to create a SKILL.md document.");
  }

  if (!input.title.trim() || !input.summary.trim()) {
    throw new Error("Title and summary are required.");
  }

  await ensureSeedSkillDocuments();

  const markdown = composeSkillDocumentMarkdown(input);
  const parsed = parseSkillDocument("draft.md", markdown);
  const pathname = documentPathForId(parsed.id);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage.from(SKILL_DOCUMENT_BUCKET).upload(pathname, markdown, {
    upsert: true,
    contentType: "text/markdown",
  });

  if (error) {
    throw new Error(`Unable to store SKILL.md in Supabase: ${error.message}`);
  }

  return {
    ...parsed,
    path: pathname,
  };
}

export async function getSkillDocumentById(documentId: string) {
  await ensureSeedSkillDocuments();
  return readRemoteDocument(documentPathForId(documentId));
}

export function toSkillDocumentResponse(
  document: ParsedSkillDocument,
  options?: {
    locked?: boolean;
    requiresPurchase?: boolean;
  },
): SkillDocumentDetail {
  return {
    id: document.id,
    path: document.path,
    title: document.title,
    slug: document.slug,
    category: document.category,
    summary: document.summary,
    preview: document.preview,
    tags: document.tags,
    ownerWallet: document.ownerWallet,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    lineCount: document.lineCount,
    templateKey: document.templateKey,
    paymentAssetContractId: document.paymentAssetContractId,
    settlementNetwork: document.settlementNetwork,
    x402Endpoint: document.x402Endpoint,
    walletRequired: document.walletRequired,
    template: document.template,
    markdown: options?.locked ? `${document.body.split("\n").slice(0, 16).join("\n")}\n\n<!-- Purchase or creator access required for the full SKILL.md -->` : document.markdown,
    body: options?.locked ? document.body.split("\n").slice(0, 16).join("\n") : document.body,
    locked: options?.locked ?? false,
    requiresPurchase: options?.requiresPurchase ?? false,
  };
}
