"use client";

import { useCallback, useEffect, useState } from "react";

import type { SkillDocumentDetail, SkillDocumentSummary } from "@/app/lib/skill-documents/types";

type ListResponse = {
  documents: SkillDocumentSummary[];
};

type DetailResponse = {
  document: SkillDocumentDetail;
};

export function useSkillDocuments(owner?: string, enabled = true) {
  const [documents, setDocuments] = useState<SkillDocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!enabled) {
      setDocuments([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = owner ? `?owner=${encodeURIComponent(owner)}` : "";
      const response = await fetch(`/api/skills/documents${query}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load skill documents (${response.status})`);
      }

      const body = (await response.json()) as ListResponse;
      setDocuments(body.documents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unable to load skill documents"));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, owner]);

  useEffect(() => {
    loadDocuments().catch(() => undefined);
  }, [loadDocuments]);

  return {
    documents,
    isLoading,
    error,
    refetch: loadDocuments,
  };
}

export async function fetchSkillDocument(
  documentId: string,
  options?: {
    owner?: string;
    buyer?: string;
    listingId?: number;
  },
) {
  const params = new URLSearchParams();
  if (options?.owner) {
    params.set("owner", options.owner);
  }
  if (options?.buyer) {
    params.set("buyer", options.buyer);
  }
  if (typeof options?.listingId === "number") {
    params.set("listingId", String(options.listingId));
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const response = await fetch(`/api/skills/documents/${encodeURIComponent(documentId)}${suffix}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load SKILL.md (${response.status})`);
  }

  const body = (await response.json()) as DetailResponse;
  return body.document;
}
