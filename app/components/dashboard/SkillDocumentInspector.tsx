"use client";

import { Copy, Loader2 } from "lucide-react";

import { SkillDocumentPreview } from "@/app/components/SkillDocumentPreview";
import type { SkillDocumentDetail } from "@/app/lib/skill-documents/types";

type SkillDocumentInspectorProps = {
  activeDocument: SkillDocumentDetail | null;
  activeDocumentLabel: string;
  isDocumentLoading: boolean;
  documentError: string | null;
  copiedDocument: boolean;
  onCopy: () => void;
};

export function SkillDocumentInspector({
  activeDocument,
  activeDocumentLabel,
  isDocumentLoading,
  documentError,
  copiedDocument,
  onCopy,
}: SkillDocumentInspectorProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">Active document</p>
          <h3 className="font-display mt-3 text-xl font-black uppercase tracking-[-0.03em] text-white">
            {activeDocumentLabel}
          </h3>
        </div>
        {activeDocument && (
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7fbe9]"
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedDocument ? "Copied" : "Copy file"}
          </button>
        )}
      </div>

      {isDocumentLoading && (
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-[#b6c8c1]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading SKILL.md...
        </div>
      )}
      {!isDocumentLoading && documentError && (
        <div className="mt-6 rounded-[24px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {documentError}
        </div>
      )}
      {!isDocumentLoading && !documentError && !activeDocument && (
        <p className="mt-6 text-sm text-[#b6c8c1]">Open a template, your library file, or a purchased skill document to inspect it here.</p>
      )}

      {activeDocument && !isDocumentLoading && (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#6dffc8]/20 bg-[#6dffc8]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b9ffe1]">
              {activeDocument.category}
            </span>
            {activeDocument.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#d0ddd7]"
              >
                {tag}
              </span>
            ))}
          </div>

          {activeDocument.locked && (
            <div className="mt-5 rounded-[24px] border border-[#ffb168]/25 bg-[#ffb168]/10 p-4 text-sm text-[#ffd7ad]">
              Full retrieval is locked until the connected wallet owns the listing on-chain. Preview remains visible.
            </div>
          )}

          <div className="mt-5 max-h-[70vh] overflow-y-auto pr-1">
            <SkillDocumentPreview markdown={activeDocument.markdown} />
          </div>
        </>
      )}
    </div>
  );
}
