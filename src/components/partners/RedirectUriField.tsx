import { useState } from "react";
import { IconPlus, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RedirectUriFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
  inputId?: string;
}

const isValidUri = (raw: string): boolean => {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

/**
 * Add-then-list field for redirect URIs: type a URI, press Add (or Enter), and it
 * appears below as a removable chip. Reused by onboarding and the dashboard app form.
 */
export function RedirectUriField({ value, onChange, hint, inputId = "redirect-uri" }: RedirectUriFieldProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const uri = draft.trim();
    if (!uri) return;
    if (!isValidUri(uri)) {
      toast.error("Enter a full http(s) URL, e.g. https://yourapp.com/auth/callback");
      return;
    }
    if (value.includes(uri)) {
      setDraft("");
      return;
    }
    onChange([...value, uri]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <label
          htmlFor={inputId}
          className="chamfer flex-1 border border-input bg-card/40 transition-colors focus-within:border-primary"
        >
          <span className="block px-4 pt-3 text-xs text-muted-foreground">Redirect URI</span>
          <input
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
            placeholder="https://yourapp.com/auth/callback"
            className="w-full bg-transparent px-4 pb-3 pt-1 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </label>
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()} className="mb-px">
          <IconPlus className="size-4" data-icon="inline-start" aria-hidden />
          Add
        </Button>
      </div>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((uri) => (
            <li
              key={uri}
              className="inline-flex max-w-full items-center gap-2 chamfer border border-border bg-card px-3 py-1.5"
            >
              <span className="truncate font-mono text-xs text-foreground">{uri}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== uri))}
                aria-label={`Remove ${uri}`}
                className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
              >
                <IconX className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
