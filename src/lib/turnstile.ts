// Cloudflare Turnstile bootstrap used by the assets gateway session flow.
// The site key is public (it ships in the bundle); the matching secret lives only
// in the gateway Worker (TURNSTILE_SECRET).

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Turnstile requires a browser"));
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Turnstile"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function isTurnstileConfigured(): boolean {
  return Boolean(SITE_KEY);
}

export async function getTurnstileToken(timeoutMs = 30_000): Promise<string> {
  if (!SITE_KEY) {
    throw new Error("Turnstile is not configured (set VITE_TURNSTILE_SITE_KEY)");
  }
  await loadTurnstile();
  const turnstile = window.turnstile;
  if (!turnstile) throw new Error("Turnstile failed to initialise");

  return new Promise<string>((resolve, reject) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.right = "16px";
    container.style.bottom = "16px";
    container.style.zIndex = "2147483000";
    document.body.appendChild(container);

    let widgetId: string | undefined = undefined;
    const cleanup = () => {
      window.clearTimeout(timer);
      if (widgetId) {
        try {
          turnstile.remove(widgetId);
        } catch {
          /* widget already gone */
        }
      }
      container.remove();
    };

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Turnstile challenge timed out"));
    }, timeoutMs);

    widgetId = turnstile.render(container, {
      sitekey: SITE_KEY,
      appearance: "interaction-only",
      callback: (token: string) => {
        cleanup();
        resolve(token);
      },
      "error-callback": () => {
        cleanup();
        reject(new Error("Turnstile challenge failed"));
      },
    });
  });
}
