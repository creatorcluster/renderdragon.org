export type ChibiStyle = "classic" | "inked";

export const fetchSkinByUsername = async (username: string): Promise<Blob> => {
  const res = await fetch(`https://mc-heads.net/skin/${encodeURIComponent(username)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`skin_request_failed_${res.status}`);
  return res.blob();
};

export function exportCanvas(source: HTMLCanvasElement, factor: number): HTMLCanvasElement {
  if (factor <= 1) return source;
  const out = document.createElement("canvas");
  out.width = source.width * factor;
  out.height = source.height * factor;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}
