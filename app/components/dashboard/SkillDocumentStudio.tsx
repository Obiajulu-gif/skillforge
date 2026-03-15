"use client";

import { FileCode2, Loader2 } from "lucide-react";

import { SkillDocumentPreview } from "@/app/components/SkillDocumentPreview";
import type { SkillDocumentSummary } from "@/app/lib/skill-documents/types";

type SkillDocumentStudioProps = {
  category: string;
  onCategoryChange: (value: string) => void;
  tagsInput: string;
  onTagsInputChange: (value: string) => void;
  skillMarkdown: string;
  onSkillMarkdownChange: (value: string) => void;
  onRebuildDraft: () => void;
  templateDocuments: SkillDocumentSummary[];
  templatesLoading: boolean;
  selectedTemplateId: string | null;
  onLoadTemplate: (document: SkillDocumentSummary) => void;
};

export function SkillDocumentStudio({
  category,
  onCategoryChange,
  tagsInput,
  onTagsInputChange,
  skillMarkdown,
  onSkillMarkdownChange,
  onRebuildDraft,
  templateDocuments,
  templatesLoading,
  selectedTemplateId,
  onLoadTemplate,
}: SkillDocumentStudioProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">Templates</p>
            <h3 className="font-display mt-3 text-xl font-black uppercase tracking-[-0.03em] text-white">
              Clawhub-style starter skills
            </h3>
          </div>
          {templatesLoading && <Loader2 className="h-4 w-4 animate-spin text-[#8bffd4]" />}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {templateDocuments.map((document) => (
            <button
              key={document.id}
              onClick={() => onLoadTemplate(document)}
              type="button"
              className={`rounded-[22px] border p-4 text-left transition-colors ${
                selectedTemplateId === document.id
                  ? "border-[#6dffc8]/45 bg-[#6dffc8]/10"
                  : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8bffd4]">{document.category}</span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#95aba4]">
                  {document.lineCount} lines
                </span>
              </div>
              <h4 className="mt-3 text-base font-semibold text-white">{document.title}</h4>
              <p className="mt-2 text-sm leading-6 text-[#b6c8c1]">{document.summary}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#6dffc8]/60"
          >
            {["Marketing", "DevOps", "Coding", "Sales", "Operations", "Research"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            value={tagsInput}
            onChange={(event) => onTagsInputChange(event.target.value)}
            placeholder="Tags, comma separated"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#6dffc8]/60"
          />
        </div>

        <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">
                <FileCode2 className="h-4 w-4 text-[#8bffd4]" />
                SKILL.md editor
              </div>
              <button
                type="button"
                onClick={onRebuildDraft}
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8bffd4]"
              >
                Rebuild draft
              </button>
            </div>
            <textarea
              value={skillMarkdown}
              onChange={(event) => onSkillMarkdownChange(event.target.value)}
              className="h-[340px] w-full rounded-[20px] border border-white/10 bg-[#05090a] px-4 py-4 font-mono text-[13px] leading-6 text-[#d7fbe9] outline-none placeholder:text-slate-500 focus:border-[#6dffc8]/60 xl:h-[420px]"
              spellCheck={false}
            />
          </div>

          <div className="min-w-0">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">Rendered preview</p>
            <div className="max-h-[340px] overflow-y-auto pr-1 xl:max-h-[420px]">
              <SkillDocumentPreview markdown={skillMarkdown} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
