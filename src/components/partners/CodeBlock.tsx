import { useMemo } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/github-dark.css";
import { cn } from "@/lib/utils";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const LANGUAGES: Record<string, "bash" | "javascript" | "json"> = {
  bash: "bash",
  sh: "bash",
  shell: "bash",
  // node samples are plain JS (uses top-level await, not a module type)
  javascript: "javascript",
  js: "javascript",
  node: "javascript",
  json: "json",
};

/**
 * A code block with syntax highlighting (highlight.js). Unknown languages and
 * plain text fall back to an escaped, unhighlighted block.
 */
export function CodeBlock({
  code,
  language = "plaintext",
  className,
}: {
  code: string;
  language?: string;
  className?: string;
}) {
  const html = useMemo(() => {
    const mapped = LANGUAGES[language];
    if (!mapped) return escapeHtml(code);
    try {
      return hljs.highlight(code, { language: mapped, ignoreIllegals: true }).value;
    } catch {
      return escapeHtml(code);
    }
  }, [code, language]);

  return (
    <pre
      className={cn(
        "chamfer mt-3 overflow-x-auto border border-border bg-muted/60 p-4 text-xs leading-relaxed",
        className,
      )}
    >
      <code
        className="hljs !bg-transparent font-mono"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  );
}
