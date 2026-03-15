"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type SkillDocumentPreviewProps = {
  markdown: string;
};

export function SkillDocumentPreview({ markdown }: SkillDocumentPreviewProps) {
  const normalizedMarkdown = markdown.replace(/^---[\s\S]*?---\s*/u, "");

  return (
    <div className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display mb-4 text-3xl font-black uppercase tracking-[-0.04em] text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 mb-3 text-xl font-bold uppercase tracking-[0.04em] text-[#dffcf0]">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#b9ffe1]">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4 text-sm leading-7 text-[#c7d7d1]">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 space-y-2 text-sm leading-7 text-[#c7d7d1]">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 space-y-2 text-sm leading-7 text-[#c7d7d1]">{children}</ol>,
          li: ({ children }) => <li className="ml-5 list-disc">{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-black/35 px-1.5 py-0.5 text-[0.85em] text-[#9dffd9]">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-2xl border border-white/8 bg-black/35 p-4 text-xs text-[#d7fbe9]">
              {children}
            </pre>
          ),
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          a: ({ children, href }) => (
            <a href={href} className="text-[#8bffd4] underline underline-offset-4">
              {children}
            </a>
          ),
        }}
      >
        {normalizedMarkdown}
      </ReactMarkdown>
    </div>
  );
}
