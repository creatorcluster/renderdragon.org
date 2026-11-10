import type { Resource } from "@/types/resources";

export const RESOURCES_REPO_RAW_BASE =
  "https://raw.githubusercontent.com/Renderdragonorg/resources_renderdragon/main";

export const RESOURCES_REPO_BLOB_BASE =
  "https://github.com/Renderdragonorg/resources_renderdragon/blob/main";

const toRepoFilenamePart = (value: string) => value.toLowerCase().replace(/ /g, "%20");

const creditPart = (credit?: string) =>
  credit ? `__${credit.replace(/ /g, "_")}` : "";

const repoPath = (category: string, filename: string) =>
  `${RESOURCES_REPO_RAW_BASE}/${category}/${filename}`;

const buildFontRepoUrl = (
  title: string,
  filetype: string,
  credit?: string,
): string =>
  repoPath("fonts", `${toRepoFilenamePart(title)}${creditPart(credit)}.${filetype}`);

/**
 * The filename convention inside the resources repo:
 * `<category>/<title lowercased, spaces as %20>[__<credit, spaces as _>].<filetype>`
 */
export const buildResourceRepoUrl = (resource: Resource): string | undefined => {
  if (!resource?.title || !resource?.category || !resource.filetype) {
    return undefined;
  }

  return repoPath(
    resource.category,
    `${toRepoFilenamePart(resource.title)}${creditPart(resource.credit)}.${resource.filetype}`,
  );
};

/**
 * Preset previews are not the preset file itself: they live under
 * `presets/PREVIEWS/` as mp4 and do not carry a filetype.
 */
const buildPresetPreviewUrl = (resource: Resource): string | undefined => {
  if (resource.category !== "presets" || !resource.title) {
    return undefined;
  }
  const prefix = resource.subcategory === "adobe" ? "a" : "d";
  return repoPath("presets", `PREVIEWS/${prefix}${toRepoFilenamePart(resource.title)}.mp4`);
};

/**
 * The canonical identity of a resource for favourites and other URL-keyed maps.
 * Deliberately does NOT fall back to a repo path.
 */
export const getResourceUrl = (resource: Resource): string => {
  return resource.download_url || resource.preview_url || resource.image_url || "";
};

/** URL the preview players use: preview_url first, then download_url, then the repo. */
export const resolvePlayableUrl = (resource: Resource): string | undefined => {
  return (
    resource.preview_url ||
    resource.download_url ||
    buildPresetPreviewUrl(resource) ||
    buildResourceRepoUrl(resource)
  );
};

/** URL a download uses: download_url first, then preview_url/image_url, then the repo. */
export const resolveDownloadUrl = (resource: Resource): string | undefined => {
  return (
    resource.download_url ||
    resource.preview_url ||
    resource.image_url ||
    buildResourceRepoUrl(resource)
  );
};

/** Repo path of a font file for a full Resource (includes the credit suffix). */
export const resourceFontUrl = (resource: Resource): string | undefined => {
  if (!resource?.title || !resource?.filetype) {
    return undefined;
  }
  return buildFontRepoUrl(resource.title, resource.filetype, resource.credit);
};

/** Repo path of a font file when only the font name is known (no credit info). */
export const fontFileUrl = (fontName: string): string => {
  return buildFontRepoUrl(fontName, "ttf");
};
